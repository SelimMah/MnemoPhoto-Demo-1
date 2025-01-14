from imports import *
from catalogue import *

app = Flask(__name__)

global_folder_path = None

@app.route('/')
def album():
    return redirect(url_for('home'))
    # return send_from_directory('.', 'templates/album.html')

@app.route('/home')
def home():
    # Route pour servir la page HTML principale
    return send_from_directory('.', 'templates/home.html')

@app.route('/album/<album_name>')
def album2(album_name):
    # Route pour servir la page HTML principale
    return send_from_directory('.', 'templates/album.html')

@app.route('/folder/<folder_name>')
def folder(folder_name):
    # Route pour servir la page HTML principale
    return send_from_directory('.', 'templates/folder.html')

@app.route('/browser/<album_name>')
def browser(album_name):
    # Route pour servir la page HTML principale
    return send_from_directory('.', 'templates/browser.html')

@app.route('/reset-catalogue', methods=['POST'])
def reset_catalogue():
    data = request.get_json()
    global_folder_path = data.get('folderPath')
    
    globalCatalogue = Catalogue(os.path.basename(global_folder_path), global_folder_path)
    globalCatalogue.init_catalogue()
    globalCatalogue.save_to_json()
    globalCatalogue.save_basicInfos_to_json()
    
    return f"Catalogue reset from {global_folder_path}"

@app.route('/get-Album/<album_name>', methods=['GET'])
def get_album(album_name):
    try:
        basic_infos_file = "catalogueInfos/BasicInfos.json"
        basic_infos = load_data_json(basic_infos_file)
        albums = basic_infos["albums"]

    
        folder_name = request.headers.get('folderName')

        print(album_name)
        print(folder_name)
        
        for album in albums:
            if album.get('name').lower() == album_name.lower():

                if folder_name.lower() != "catalogue":
                    if album['folder'].lower() != folder_name.lower():
                        continue

                album_path = album.get('json_file')  
                
                # Charger le contenu du fichier JSON de l'album
                try:
                    return jsonify(load_data_json(album_path)) 
                except FileNotFoundError:
                    return jsonify({"error": f"Fichier JSON introuvable : {album_path}"}), 404
                except json.JSONDecodeError:
                    return jsonify({"error": f"Erreur de décodage JSON pour le fichier : {album_path}"}), 500
        
        # Si aucun album avec ce nom n'est trouvé
        return jsonify({"error": f"Aucun album trouvé avec le nom : {album_name}"}), 404
    except FileNotFoundError:
        return jsonify({"error": f"Fichier introuvable : {basic_infos_file}"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Erreur de décodage JSON pour le catalogue d'albums"}), 500

@app.route('/get-Catalogue/', methods=['GET'])
def get_catalogue():
    try:
        basic_infos_file = "catalogueInfos/BasicInfos.json"
        basic_infos = load_data_json(basic_infos_file)
        return jsonify(basic_infos["catalogueInfo"])
    
    except FileNotFoundError:
        return jsonify({"error": f"Fichier JSON introuvable : {album_path}"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": f"Erreur de décodage JSON pour le fichier : {album_path}"}), 500

@app.route('/get-Folder/<folder_name>', methods=['GET'])
def get_folder(folder_name):
    try:
        
        basic_infos_file = "catalogueInfos/BasicInfos.json"
        basic_infos = load_data_json(basic_infos_file)
        folders = basic_infos["folders"]

        for folder in folders:
            if folder["name"].lower() == folder_name:
                return jsonify(folder)   


        # Chemin du catalogue des albums
        catalogue_file = "catalogueInfos/folderCatalogue.json"
        
        # Charger le fichier JSON principal
        with open(catalogue_file, 'r', encoding='utf-8') as file:
            folders = json.load(file)
        
        for folder in folders:
            print(folder)
            if folder["name"].lower() == folder_name:
                return jsonify(folder)                 
        
        # Si aucun album avec ce nom n'est trouvé
        return jsonify({"error": f"Aucun folder trouvé avec le nom : {folder_name}"}), 404
    except FileNotFoundError:
        return jsonify({"error": f"Fichier introuvable : {catalogue_file}"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Erreur de décodage JSON pour le catalogue d'albums"}), 500

@app.route('/update-maiImage/<image_name>', methods=['PATCH'])
def update_maiImage(image_name):
        print("I'm updating _maiImage")
        basic_infos_file = "catalogueInfos/BasicInfos.json"

        data = request.json

        new_image = data.get("newImage")
        album_name = data.get("album-name")
        folder_name = data.get("folder-name")
        image_URL = data.get("image-URL")
        albumJson_path = None

        basic_infos = load_data_json(basic_infos_file)
        catalogueInfo = basic_infos["catalogueInfo"]
        folders = basic_infos["folders"]
        albums = basic_infos["albums"]

        for album in albums:
            print(album["name"])
            if album["folder"] == None and folder_name.lower() == "catalogue":
                print("fe")
            elif album["folder"] != None and album["folder"].lower() != folder_name.lower():
                print("continu")
                continue
            
            if album["name"].lower() == album_name.lower():
                album["mainImageURL"] = image_URL
                albumJson_path = album["json_file"]
                break

        for element in catalogueInfo["catalogues"]:
            if folder_name == "catalogue" and element["type"] == "album":
                if element["name"] == album_name:
                    element["mainImageURL"] = image_URL
                    break         

            elif element["type"] == "folder":
                if element["name"].lower() == folder_name.lower():
                    newMainImages = []
                    for mainImage in element["mainImagesURL"]:
                        if mainImage["album"] == album_name:
                            newMainImages.append({"album": album_name, "URL": image_URL})
                        else:
                            newMainImages.append(mainImage)

                    element["mainImagesURL"] = newMainImages
                    break
        
        if folder_name != "catalogue":
            for folder in folders:
                 if folder["name"].lower() == folder_name.lower():
                    newMainImages = []
                    for mainImage in folder["mainImagesURL"]:
                        if mainImage["album"] == album_name:
                            newMainImages.append({"album": album_name, "URL": image_URL})
                        else:
                            newMainImages.append(mainImage)      

                    for album in folder["albums"]:
                        if album["name"] == album_name:
                            album["mainImageURL"] = image_URL
                            break

                    folder["mainImagesURL"] = newMainImages

        jsonAlbum = load_data_json(albumJson_path)
        jsonAlbum["mainImage"]["name"] = new_image["name"]
        jsonAlbum["mainImage"]["URL"] = image_URL
        save_data_json(albumJson_path, jsonAlbum)

        basicInfos = {
            "catalogueInfo" : catalogueInfo,
            "folders": folders,
            "albums" : albums,
        }

        save_data_json(basic_infos_file, basicInfos)

        return f"Image URL updated for album: {album_name}"

@app.route('/update-home-sort', methods=['PATCH'])
def update_home_sort():
    basic_infos_file = "catalogueInfos/BasicInfos.json"

    data = request.json

    item_name = data.get("itemName")
    order_up = data.get("order_up")

    order_up = 1 if order_up == 1 else -1
    
    print(item_name)
    print(order_up)

    if not item_name or order_up is None:
        return {"error": "Invalid input"}, 400

    basic_infos = load_data_json(basic_infos_file)
    catalogueInfo = basic_infos["catalogueInfo"]
    folders = basic_infos["folders"]
    albums = basic_infos["albums"]


    for i in range(len(catalogueInfo["catalogues"])):
        if catalogueInfo["catalogues"][i]["name"] == item_name:
            if 0 <= i + order_up < len(catalogueInfo["catalogues"]):
                catalogueInfo["catalogues"][i]["index"] = (catalogueInfo["catalogues"][i]["index"] + order_up)
                catalogueInfo["catalogues"][i + order_up]["index"] = (catalogueInfo["catalogues"][i + order_up]["index"] - order_up)
                break  


    catalogueInfo["catalogues"] = sorted(catalogueInfo["catalogues"], key=lambda x: x["index"])

    basicInfos = {
        "catalogueInfo" : catalogueInfo,
        "folders": folders,
        "albums" : albums,
    }

    save_data_json(basic_infos_file, basicInfos)
    
    return f"Image URL updated for album"

@app.route('/serve-image')
def serve_image():
    folder_path = request.args.get('folder')
    filename = request.args.get('filename')
    quality = request.args.get('quality', default=75, type=int)  # Qualité (par défaut 75)
    width = request.args.get('width', type=int)  # Largeur cible facultative
    height = request.args.get('height', type=int)  # Hauteur cible facultative

    if not folder_path or not filename:
        return 'Chemin ou fichier manquant', 400

    file_path = os.path.join(folder_path, filename)

    if not os.path.exists(file_path):
        return 'Fichier introuvable', 404

    try:
        file_extension = os.path.splitext(filename)[-1].lower()
        if file_extension.lower() in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
            response = send_from_directory(folder_path, filename)
            response.headers["Cache-Control"] = "public, max-age=3600"
            return response

        # Si la qualité est supérieure à 100, renvoyer l'image d'origine
        if quality >= 100:
            print("tkt frr je donne tout", quality)
            return send_from_directory(folder_path, filename)

        # Ouvrir l'image avec Pillow
        image = Image.open(file_path)

        # Redimensionner l'image si largeur ou hauteur spécifiée
        if width or height:
            original_width, original_height = image.size
            target_width = width or original_width
            target_height = height or original_height
            image = image.resize((target_width, target_height), Image.ANTIALIAS)

        # Compresser l'image et l'envoyer comme réponse
        img_io = io.BytesIO()
        image.save(img_io, format=image.format, quality=quality)
        img_io.seek(0)

        return send_file(img_io, mimetype=f'image/{image.format.lower()}')
    except Exception as e:
        return f'Erreur lors du traitement'

@app.route('/serve-video')
def serve_video():
    import logging
    logging.basicConfig(level=logging.DEBUG)

    folder_path = request.args.get('folder')
    filename = request.args.get('filename')

    if not folder_path or not filename:
        logging.error("Chemin ou fichier manquant")
        return 'Chemin ou fichier manquant', 400

    file_path = os.path.join(folder_path, filename)
    logging.debug(f"Tentative de lecture du fichier : {file_path}")

    if not os.path.exists(file_path):
        logging.error(f"Fichier introuvable : {file_path}")
        return 'Fichier introuvable', 404

    try:
        # Streaming HTTP
        range_header = request.headers.get('Range', None)
        if range_header:
            logging.debug(f"Header Range reçu : {range_header}")
            range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if not range_match:
                logging.error("Header Range invalide")
                abort(416)

            start_byte = int(range_match.group(1))
            end_byte = range_match.group(2)
            file_size = os.path.getsize(file_path)

            if end_byte:
                end_byte = min(int(end_byte), file_size - 1)
            else:
                end_byte = file_size - 1

            chunk_size = end_byte - start_byte + 1
            with open(file_path, 'rb') as f:
                f.seek(start_byte)
                data = f.read(chunk_size)

            response = Response(data, status=206, mimetype='video/mp4')
            response.headers['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'
            response.headers['Accept-Ranges'] = 'bytes'
            response.headers['Content-Length'] = str(chunk_size)
            return response

        # Cas où aucun en-tête "Range" n'est reçu
        logging.debug("Aucun header Range, envoi complet du fichier")
        return send_file(file_path, mimetype='video/mp4')
    except Exception as e:
        logging.exception("Erreur interne du serveur")
        return f"Erreur interne du serveur : {e}", 500

@app.route('/serve-preview')
def serve_preview():
    folder_path = request.args.get('folder')
    filename = request.args.get('filename')
    quality = request.args.get('quality', default=75, type=int)

    if not folder_path or not filename:
        return jsonify({"error": "Missing 'folder' or 'filename' parameter."}), 400

    video_path = os.path.join(folder_path, filename)

    if not os.path.exists(video_path):
        return jsonify({"error": "Video file not found."}), 404

    try:
        # Open the video file using OpenCV
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            return jsonify({"error": "Failed to open video file."}), 500

        # Read the first frame
        ret, frame = cap.read()
        cap.release()

        if not ret:
            return jsonify({"error": "Failed to read the first frame of the video."}), 500

        # Convert the frame to a PIL image
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(frame_rgb)

        # Compress the image and serve it
        img_io = io.BytesIO()
        image.save(img_io, format='JPEG', quality=quality)
        img_io.seek(0)

        return send_file(img_io, mimetype='image/jpeg')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/<path:path>')
def serve_static_files(path):
    # Route pour servir les fichiers statiques comme CSS et JS
    return send_from_directory('.', path)

@app.errorhandler(500)
def handle_server_error(e):
    return jsonify({"error": "Une erreur interne s'est produite."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

