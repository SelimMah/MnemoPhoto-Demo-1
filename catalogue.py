from imports import *

globalCatalogue = None

class Catalogue:
    def __init__(self, name, catalogue_path):
        self.name = name
        self.catalogue_path = catalogue_path
        self.dateRange = [datetime.max.isoformat(), datetime.min.isoformat()]
        self.nVideo = 0
        self.nImages = 0
        self.nAlbums = 0
        self.nFolder = 0
        self.catalogues = []
    
    def init_catalogue(self):
        print("Initiating catalogue")
        if not os.path.exists(self.catalogue_path):
            print(f"Erreur : Le chemin '{self.catalogue_path}' n'existe pas.")
            return
        
        index = 0
        for item_name in os.listdir(self.catalogue_path):
            item_path = os.path.join(self.catalogue_path, item_name)

            # Ignorer les fichiers/dossiers cachés
            if item_name.startswith('.'):
                continue

            if os.path.isdir(item_path):
                if self.is_folder(item_path):
                    # C'est un Folder
                    folder = Folder(name=item_name, folder_path=item_path)
                    folder.init_folder()
                    folder.index = index
                    index += 1
                    self.catalogues.append(folder)
                    self.nVideo += folder.nVideo
                    self.nImages += folder.nImages
                    self.nFolder += 1
                else:
                    # C'est un Album
                    album = Album(name=item_name, folder=None, folder_path=item_path)
                    album.init_album()
                    album.index = index
                    index += 1
                    self.catalogues.append(album)
                    self.nAlbums += 1
                    self.nVideo += album.nVideo
                    self.nImages += album.nImages
 
    def is_folder(self, path):
        """
        Vérifie si le chemin contient des sous-dossiers.
        Retourne True si le premier élément du dossier est un sous-dossier, False sinon.
        """
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                return True
        return False   

    def update_date_range(self):
        """
        Met à jour la plage de dates du catalogue en fonction de son contenu.
        """
        for item in self.catalogues:
            if isinstance(item, Album):
                self.dateRange[0] = min(self.dateRange[0], item.dateRange[0])
                self.dateRange[1] = max(self.dateRange[1], item.dateRange[1])

    def print_data(self):
        if not self.catalogues:
            print("Aucun album dans le dossier.")
            return
        
        
        print("\033[91m==================================================================================================\033[0m")
        print(f"Name: {self.name}")
        print(f"Catalogue_path: {self.catalogue_path}")
        print(f"Date Range: {self.dateRange[0]} à {self.dateRange[1]}")
        print(f"Nombre d'album: {self.nAlbums}")
        print(f"Nombre d'folder: {self.nFolder}")
        print(f"Nombre de vidéos: {self.nVideo}")
        print(f"Nombre d'images: {self.nImages}")
        print("\033[91m==================================================================================================\033[0m")

        print("  Liste des Albums :")
        for album in self.catalogues:
            album.print_data()        
        print("\033[91m==================================================================================================\033[0m")

    def save_to_json(self):
        self.update_basic_info()

        for element in self.catalogues:
            element.save_to_json()
        
        self.save_basicInfos_to_json()
    
    def save_basicInfos_to_json(self):
        basic_infos_file = "catalogueInfos/BasicInfos.json"

        catalogues = []
        folders = []
        albums = []

        for element in self.catalogues :
            catalogues.append(element.get_basic_Info())
            if element.type == "folder":
                folders.append(element.get_basic_Info())
                for album in element.albums:
                    albums.append(album.get_basic_Info())
            else:
                albums.append(element.get_basic_Info())

        catalogueInfo = {
            "name": self.name,
            "catalogue_path": self.catalogue_path,
            "dateRange": [date.isoformat() if isinstance(date, datetime) else date for date in self.dateRange],
            "nVideo": self.nVideo,
            "nImages": self.nImages,
            "nAlbums": self.nAlbums,
            "nFolder": self.nFolder,
            "catalogues": catalogues,     
        }

        basicInfos = {
            "catalogueInfo" : catalogueInfo,
            "folders": folders,
            "albums" : albums,
        }

        save_data_json(basic_infos_file, basicInfos)

    def update_basic_info(self) :
        basic_infos_file = "catalogueInfos/BasicInfos.json"

        if os.path.exists(basic_infos_file):
            oldBasicInfo = load_data_json(basic_infos_file)
            name_index_dict = {}

            for item in oldBasicInfo["catalogueInfo"]["catalogues"]:
                name_index_dict[item["name"]] = item["index"]
        
            for item in self.catalogues:
                if item.name in name_index_dict:
                    item.index = name_index_dict[item.name]

            self.catalogues.sort(key=lambda x: getattr(x, "index", float('inf')))

        for i, item in enumerate(self.catalogues):
            item.index = i
  
class Folder:
    def __init__(self, name, folder_path):
        self.name = name
        self.folder_path = folder_path
        self.albums = []
        self.dateRange = [datetime.max, datetime.min]
        self.mainImages = []
        self.nAlbums = 0
        self.nVideo = 0
        self.nImages = 0
        self.type = "folder"
        self.index = 0

    def init_folder(self):
        print(f"Initiating folder: {self.name}")
        if not self.folder_path or not os.path.exists(self.folder_path):
            raise FileNotFoundError(f"Dossier introuvable : {self.folder_path}")

        for folder_name in os.listdir(self.folder_path):
            album_path = os.path.join(self.folder_path, folder_name)

            # Vérifier si le chemin est un dossier
            if os.path.isdir(album_path):
                album = Album(name=folder_name, folder=os.path.basename(self.folder_path), folder_path=album_path)
               
                album_folder = f"Catalogue/{self.name}"
                if not os.path.exists(album_folder):
                    os.makedirs(album_folder)

                album.init_album()  # Initialiser l'album
                self.albums.append(album)
                self.nAlbums += 1
                self.nVideo += album.nVideo
                self.nImages += album.nImages
                self.mainImages.append(album.mainImage)

        # Trier les albums par date (le plus récent en premier)
        self.albums.sort(key=lambda album: datetime.fromisoformat(album.dateRange[1]), reverse=True)
        self.update_date_range()

    def update_date_range(self):
        self.dateRange[0] = self.albums[-1].dateRange[0]
        self.dateRange[1] = self.albums[0].dateRange[1]
    
    def update_main_images(self):
        self.mainImages = []
        for album in self.albums:
            self.mainImages.append(album.mainImage)

    def to_dict(self):
        """Convertit l'objet Folder en dictionnaire pour la sérialisation JSON."""
        return {
            "name": self.name,
            "folder_path": self.folder_path,
            "dateRange": [date.isoformat() for date in self.dateRange],
            "nAlbums": self.nAlbums,
            "nVideo": self.nVideo,
            "nImages": self.nImages,
            "albums": [album.to_dict() for album in self.albums],
        }

    def print_data(self):
        if not self.albums:
            print("Aucun album dans le dossier.")
            return
        
        print("\033[92m=====================================================================\033")
        print(f"Name: {self.name}")
        print(f"folder_path: {self.folder_path}")
        print(f"Date Range: {self.dateRange[0]} à {self.dateRange[1]}")
        print(f"Main images: {[mainImage.URL for mainImage in self.mainImages]}")
        print(f"Nombre d'album: {self.nAlbums}")
        print(f"Nombre de vidéos: {self.nVideo}")
        print(f"Nombre d'images: {self.nImages}")
        
        print("  Liste des Albums :")
        for album in self.albums:
            album.print_data()
        
        print("=====================================================================\033[0m")

    def save_to_json(self):
        for album in self.albums:
            album.save_to_json()
        
        self.update_main_images()

    def get_basic_Info(self):
        return {
            "name": self.name,
            "type": "folder",
            "mainImagesURL": [{"album": img.album , "URL" :img.URL} for img in self.mainImages] if self.mainImages else [],
            "nAlbums": self.nAlbums,
            "nImages": self.nImages,
            "nVideos": self.nVideo,
            "dateRange": [date.isoformat() if isinstance(date, datetime) else date for date in self.dateRange],
            "json_folder" : f'Catalogue/{self.name}',
            "albums" : [album.get_basic_Info() for album in self.albums],
            "index" : self.index
            }
        
class Album:
    def __init__(self, name, folder, folder_path):
        self.name = name
        self.folder = folder
        self.dateRange = [0, 0]
        self.nVideo = 0
        self.nImages = 0
        self.mainImage = None
        self.album_path = folder_path
        self.medias = []
        self.type = "album"
        self.index = 0

    def init_album(self):
        print(f"Initiating album: {self.name}")
        if not self.album_path or not os.path.exists(self.album_path):
            return jsonify({'error': 'Dossier introuvable'}), 404

        for file_name in os.listdir(self.album_path):
            if file_name.startswith('.'):
                continue
            file_path = os.path.join(self.album_path, file_name)
            modification_date = datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            self.add_media(file_name, file_path, modification_date)

        self.medias.sort(key=lambda media: datetime.fromisoformat(media.date), reverse=True)
        self.update_date_range()

    def add_media(self, file_name, file_path, modification_date):
        album = os.path.basename(self.album_path)
        if file_name.lower().endswith(('jpg', 'jpeg', 'png', 'gif')):
            file_url = f'/serve-image?folder={self.album_path}&filename={file_name}'
            photo = Photo(name=file_name, date=modification_date, album=album, path=file_path, URL=file_url)
            photo.get_exif()
            self.medias.append(photo)
            self.nImages += 1
            if not self.mainImage:
                self.mainImage = photo
        elif file_name.lower().endswith(('mp4', 'avi', 'mov', 'mkv')):
            file_url = f'/serve-video?folder={self.album_path}&filename={file_name}'
            preview_url = f'/serve-preview?folder={self.album_path}&filename={file_name}'
            video = Video(name=file_name, date=modification_date, album=album, path=file_path, URL=file_url, previewURL =preview_url)
            self.medias.append(video)
            self.nVideo += 1

    def get_media(self, name=None, url=None):
        """
        Recherche un média par son nom ou son URL.
        
        :param name: Nom du média à rechercher (facultatif).
        :param url: URL du média à rechercher (facultatif).
        :return: Le média correspondant si trouvé, sinon None.
        """
        for media in self.medias:
            if name and media.name == name:
                return media
            if url and media.URL == url:
                return media
        return None

    def update_date_range(self):
        try:
            self.dateRange[0] = self.medias[-1].date
            self.dateRange[1] = self.medias[0].date
        except IndexError:
            return

    def print_data(self):
        """
        Affiche de manière lisible toutes les informations d'un album.
        """
        print("=====================================================================")
        print(f"Album: {self.name}")
        print(f"Folder: {self.folder if self.folder else 'Aucun'}")
        print(f"Album Path: {self.album_path}")
        print(f"Date Range: {self.dateRange[0]} à {self.dateRange[1]}")
        print(f"Nombre de vidéos: {self.nVideo}")
        print(f"Nombre d'images: {self.nImages}")
        
        # Afficher les informations de l'image principale
        if self.mainImage:
            print("\nImage principale:")
            print(f"  Nom: {self.mainImage.name}")
            print(f"  Date: {self.mainImage.date}")
            print(f"  Path: {self.mainImage.path}")
            print(f"  URL: {self.mainImage.URL}")
        else:
            print("\nAucune image principale définie.")
        
        # Afficher les informations des médias
        print("\nMédias:")
        print("=====================================================================")

    def save_to_json(self):
        json_file = f'Catalogue/{self.folder}/{self.name}.json' if self.folder else f'Catalogue/{self.name}.json'

        if os.path.exists(json_file):
            print("le fichier existe deja")
            save_data_json(json_file, self.update_json(json_file))
        
        else:
            print("le fichier n'existe pas")
            save_data_json(json_file, self.creat_json())
    
    def update_json(self, json_file):
        jsonAlbumData = load_data_json(json_file)
        
        oldMainImage = jsonAlbumData["mainImage"]["name"]
        NewImage = self.get_media(name=oldMainImage)
        if NewImage:
            self.mainImage = NewImage
        
        self.update_adress(jsonAlbumData)
        
        jsonAlbumData = self.creat_json()

        return jsonAlbumData
    
    def creat_json(self):
        jsonAlbumData = {
            "name": self.name,
            "folder": self.folder,
            "dateRange": self.dateRange,
            "nVideo": self.nVideo,
            "nImages": self.nImages,
            "mainImage": {
                "name": self.mainImage.name,
                "URL": self.mainImage.URL, 
            },
            "album_path": self.album_path, 
            "medias": [media.to_dict() for media in self.medias],
        }

        return jsonAlbumData

    def get_basic_Info(self):
        return {
            "name": self.name,
            "type": "album",
            "mainImageURL": self.mainImage.URL if self.mainImage else None,
            "nImages": self.nImages,
            "nVideos": self.nVideo,
            "dateRange": [date.isoformat() if isinstance(date, datetime) else date for date in self.dateRange],
            "json_file": f'Catalogue/{self.folder}/{self.name}.json' if self.folder else f'Catalogue/{self.name}.json',
            "folder" : self.folder,
            "index" : self.index
            }
    
    def update_adress(self, jsonAlbumData):
        for jsMedia in jsonAlbumData["medias"]:
            if jsMedia["type"] == "image":
                media = self.get_media(name=jsMedia["name"])
                if jsMedia["address"] != None:
                    media.address = jsMedia["address"]
                else:
                    if media.GPS_Coordinates != None:
                        media.address = reverse_geocode_with_google(media.GPS_Coordinates[0], media.GPS_Coordinates[1])

class Video:
    def __init__(self, name, date, album, path, URL, previewURL):
        self.name = name
        self.date = date
        self.album = album
        self.path = path
        self.URL = URL
        self.type = "video"
        self.previewURL = previewURL
    
    def to_dict(self):
        return {
            "name": self.name,
            "date": self.date,
            "album": self.album,
            "path": self.path,
            "URL" : self.URL,
            "previewURL" : self.previewURL,
            "type": self.type,
        }

class Photo:
    def __init__(self, name, date, album, path, URL):
        self.name = name
        self.date = date
        self.album = album
        self.path = path
        self.URL = URL
        self.type = "image"
        self.GPS_Coordinates = None
        self.address = None
        self.device = None

    def get_exif(self):
        try: 
            exif_data = {}
            image = Image.open(self.path)
            #save the metadata in the picture into a variable
            info = image._getexif()
            if info:
            #match the numerical tags to the ExifTags dictionary
                for tag, value in info.items():
                    decoded = ExifTags.TAGS.get(tag, tag)
                    #nested dictionary containing location data under 'GPSInfo'
                    if decoded == "GPSInfo":
                        gps_data = {}
                        for gps_tag in value:
                            sub_decoded = ExifTags.GPSTAGS.get(gps_tag, gps_tag)
                            gps_data[sub_decoded] = value[gps_tag]
                        exif_data[decoded] = gps_data
                    else:
                        exif_data[decoded] = value
            
            # print(exif_data)
            # print("")
            self.GPS_Coordinates = (self.gps_extract(exif_data))
            self.device = exif_data["Model"]
            # self.address = get_address([36.834,10.174536111111111])
            #self.exifInfo = exif_data
        except:
            return 

    def gps_extract(self, exif_data):
        gps_metadata = exif_data['GPSInfo']

        #latitudinal information
        #positive latitudes are north of the equator, negative latitudes are south of the equator
        lat_ref_num = 0
        if gps_metadata['GPSLatitudeRef'] == 'N':
            lat_ref_num += 1
        if gps_metadata['GPSLatitudeRef'] == 'S':
            lat_ref_num -= 1

        lat_list = [float(num) for num in gps_metadata['GPSLatitude']]
        lat_coordiante = (lat_list[0]+lat_list[1]/60+lat_list[2]/3600) * lat_ref_num

        #longitudinal information
        #positive longitudes are east of the prime meridian, negative longitudes are west of the prime meridian
        long_ref_num = 0
        if gps_metadata['GPSLongitudeRef'] == 'E':
            long_ref_num += 1
        if gps_metadata['GPSLongitudeRef'] == 'W':
            long_ref_num -= 1

        long_list = [float(num) for num in gps_metadata['GPSLongitude']]
        long_coordiante = (long_list[0]+long_list[1]/60+long_list[2]/3600) * long_ref_num

        #return the latitude and longitude as a tuple
        return (lat_coordiante,long_coordiante)

    def to_dict(self):
        return {
            "name": self.name,
            "date": self.date,
            "album": self.album,
            "path": self.path,
            "URL" : self.URL,
            "type": self.type,
            "GPS_Coordinates": self.GPS_Coordinates,
            "device": self.device,
            "address": self.address,
        }

# globalCatalogue = Catalogue(os.path.basename("C:\\Users\\selim\\Desktop\\‎\\Test\\smallCatalogue"), "C:\\Users\\selim\\Desktop\\‎\\Test\\smallCatalogue")
# globalCatalogue = Catalogue(os.path.basename("C:\\Users\\selim\\Desktop\\‎\\Test\\hehe"), "C:\\Users\\selim\\Desktop\\‎\\Test\\hehe")
# globalCatalogue.init_catalogue()
# globalCatalogue.print_data()
# globalCatalogue.save_to_json()
# globalCatalogue.save_basicInfos_to_json()
