from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for, send_file, Response, abort
import io
import os
import shutil
from datetime import datetime
import json
import stat
import mimetypes
import re
import cv2

from PIL import Image, ExifTags
from PIL.ExifTags import TAGS

from geopy.geocoders import Nominatim
import requests


def delet_by_force(func, path, exc_info):
    """
    Force the removal of a file/directory by changing permissions.
    """
    os.chmod(path, stat.S_IWRITE)  # Remove read-only attribute
    func(path)  # Retry the original function
 
def load_data_json(file_path):
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
    except Exception as e:
        print(f"Erreur lors du chargement du fichier JSON {file_path}: {e}")
    return {}

def save_data_json(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
        print(f"Data save in: {file_path}")
    except Exception as e:
        print(f"Erreur lors de l'enregistrement des données JSON : {e}")

def get_address(GPS_Coordinates):
    """
    Convertit des coordonnées (latitude, longitude) en une adresse en français.
    
    :param latitude: Latitude de l'emplacement.
    :param longitude: Longitude de l'emplacement.
    :return: Adresse en français ou un message d'erreur.
    """
    try:
        latitude = GPS_Coordinates[0]
        longitude = GPS_Coordinates[1]
        # Initialisation du géolocaliseur
        geolocator = Nominatim(user_agent="http")
        
        # Conversion des coordonnées en adresse avec la langue spécifiée
        location = geolocator.reverse((latitude, longitude), language="fr")
        
        # Retourner l'adresse en français si elle est disponible
        return location.address if location else "No adresse"
    except Exception as e:
        return f"Erreur lors de la récupération de l'adresse : {e}"

def reverse_geocode_with_google(latitude, longitude):
    """
    Convertit des coordonnées (latitude, longitude) en adresse à l'aide de l'API Google Geocoding.
    
    :param latitude: Latitude de la position.
    :param longitude: Longitude de la position.
    :param api_key: Clé API Google Geocoding.
    :return: L'adresse correspondante sous forme de chaîne ou un message d'erreur.
    """
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "latlng": f"{latitude},{longitude}",
        "key": "",
        "language": "fr"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  
        data = response.json()
        
        if data.get("status") == "OK":
            print(data["results"][0]["formatted_address"])
            return data["results"][0]["formatted_address"]
        else:
            return f"Erreur de l'API Google: {data.get('status', 'Erreur inconnue')}"
    except requests.exceptions.RequestException as e:
        return f"Erreur réseau ou HTTP: {e}"
    except Exception as e:
        return f"Erreur inattendue: {e}"


    # Split the path into folder and filename
    folder, filename = os.path.split(file_path)
    
    # Convert the folder path to a valid URL format
    folder_url = urllib.parse.quote(folder.replace('\\', '/'))
    
    # Create the URL
    url = f"/serve-preview?folder={folder_url}&filename={urllib.parse.quote(filename)}"
    return url