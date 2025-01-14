const fileSelectorButton = document.querySelector(".file-selector");
const clearLSButton = document.querySelector(".clear-storage-button");
const LoadFromLSButton = document.querySelector(".Load-storage-button");
const sortRadioButtons = document.querySelectorAll('input[name="sort"]');
const groupRadioButtons = document.querySelectorAll(
  'input[name="type-filter"]'
);
const mainImageButton = document.querySelectorAll("main-image-button");

const gallery = document.getElementById("main-content");
const albumInfo = document.getElementById("home-element-count");
const gridOptions = document.getElementsByClassName("grid-options");
const headerImg = document.getElementById("header-img");
const headerAlbumName = document.getElementById("header-album-name");

let controller = new AbortController();
let signal = controller.signal;

/**
 * @class PageHandler
 * Classe responsable de la gestion et de l'affichage des albums et médias dans la galerie.
 */
class PageHandler {
  /**
   * @constructor
   * @param {Album} album - L'album à afficher.
   */
  constructor(album) {
    if (!album) {
      return;
    }

    this.album = album;
  }

  /**
   * @method addThumbnailMedia
   * Ajoute une vignette pour un média (image ou vidéo) dans la galerie.
   * @param {Object} media - Le média à ajouter.
   */
  addThumbnailMedia(media) {
    // Créer la vignette du média avec la date stockée dans dataset
    let thumbnail;
    if (media instanceof Video) {
      thumbnail = Video.createMediaThumbnail(media);
    } else if (media instanceof Photo) {
      thumbnail = Photo.createMediaThumbnail(media);
    }

    thumbnail.dataset.date = media.date; // Stocker la date dans l'attribut dataset

    // Insérer la vignette au bon endroit dans la galerie
    this.insertThumbnailInOrder(thumbnail);
  }

  /**
   * @method initPage
   * Initialise la page en affichant les médias de l'album.
   * @param {Array} medias - Liste des médias à afficher.
   */
  async initPage(medias) {
    await this.album.initAlbum(medias);
    albumInfo.style.display = "block";
    document.getElementById("dropdown-album-name").innerHTML = this.album.name;
    document.getElementById("dropdown-folder-name").innerHTML =
      this.album.folder;
    document.getElementById("dropdown-date1-name").innerHTML =
      this.album.dateRange[0].slice(0, 10);
    document.getElementById("dropdown-date2-name").innerHTML =
      this.album.dateRange[1].slice(0, 10);
    document.getElementById("dropdown-nPhoto-name").innerHTML =
      this.album.nImages;
    document.getElementById("dropdown-nVideo-name").innerHTML =
      this.album.nVideo;
    albumInfo.innerHTML = `${this.album.nImages} photos, ${this.album.nVideo} videos`;

    console.log("Page en initialisation");
    for (const media of this.album.medias) {
      this.addThumbnailMedia(media);
    }

    groupRadioButtons.forEach((radio) => {
      radio.addEventListener("change", this.handleTypeFilterChange);
    });

    sortRadioButtons.forEach((radio) => {
      radio.addEventListener("change", this.updateSort);
    });
    this.updateSort();

    headerImg.addEventListener("click", () => {
      // Scroller vers le haut en douceur
      window.scrollTo({
        top: 0, // Position en haut de la page
        behavior: "smooth", // Animation fluide
      });
    });

    headerAlbumName.addEventListener("click", () => {
      window.history.back(); // Retourne à la page précédente dans l'historique
    });

    headerImg.src = this.album.mainImageURL;

    console.log(headerImg.src);
    headerAlbumName.innerHTML = this.album.name;
  }

  /**
   * @method insertThumbnailInOrder
   * Insère une vignette dans la galerie en respectant l'ordre chronologique.
   * @param {HTMLElement} thumbnail - La vignette à insérer.
   */
  insertThumbnailInOrder(thumbnail) {
    const thumbnails = Array.from(gallery.querySelectorAll(".thumbnail"));

    let inserted = false;

    for (let i = 0; i < thumbnails.length; i++) {
      const existingDate = thumbnails[i].dataset.date;

      // Comparer les dates, si la nouvelle date est plus récente, on insère après
      if (Album.getHoursDifference(thumbnail.dataset.date, existingDate) > 0) {
        gallery.insertBefore(thumbnail, thumbnails[i + 1]); // Insérer après l'élément actuel
        inserted = true;
        break;
      }
    }

    // Si la vignette n'a pas été insérée, cela signifie qu'elle est plus ancienne que toutes les vignettes existantes
    if (!inserted) {
      gallery.appendChild(thumbnail); // Ajoute la vignette à la fin
    }
  }

  /**
   * @static
   * @method sortArticlesByDate
   * Trie les articles dans la galerie par date.
   * @param {boolean} ascending - Indique si le tri est croissant.
   */
  static sortArticlesByDate(ascending) {
    const container = document.getElementById("main-content"); // Conteneur des articles
    const articles = Array.from(container.querySelectorAll(".thumbnail")); // Récupérer tous les articles

    // Fonction de comparaison des dates en utilisant Album.getHoursDifference
    articles.sort((a, b) => {
      const dateA = a.dataset.date;
      const dateB = b.dataset.date;

      // Utiliser Album.getHoursDifference pour comparer les dates
      const comparison = Album.getHoursDifference(dateA, dateB);

      // Retourner la comparaison en fonction de l'ordre souhaité
      return ascending ? comparison : -comparison; // Inverser le résultat si ascending est false
    });

    // Réinsérer les articles triés dans le conteneur
    articles.forEach((article) => container.appendChild(article));
  }

  /**
  * @method updateSort
  * Met à jour le tri des articles en fonction de l'option sélectionnée.
  */
  updateSort() {
    sortRadioButtons.forEach((radio) => {
      const icon = radio.nextElementSibling;
      if (radio.checked) {
        PageHandler.sortArticlesByDate(radio.value == "last-recent");
        icon.style.opacity = 1;
      } else {
        icon.style.opacity = 0;
      }
    });
  }

  /**
   * @method handleTypeFilterChange
   * Applique un filtre sur les médias affichés dans la galerie.
   */
  handleTypeFilterChange() {
    const galleryItems = gallery.querySelectorAll(".thumbnail");
    let selectedValue = document.querySelector(
      'input[name="type-filter"]:checked'
    ).value;

    switch (selectedValue) {
      case "photos-filter":
        galleryItems.forEach((item) => {
          if (item.dataset.type !== "image") {
            item.style.display = "none";
          } else {
            item.style.display = "block";
          }
        });
        break;
      case "album-filter":
        galleryItems.forEach((item) => {
          item.style.display = "block";
        });
        break;
      case "video":
        galleryItems.forEach((item) => {
          if (item.dataset.type !== "video") {
            item.style.display = "none";
          } else {
            item.style.display = "block";
          }
        });
        break;
      default:
    }
  }
}

/**
 * @class Album
 * Classe représentant un album contenant des médias (photos et vidéos).
 */
class Album {
  /**
   * @constructor
   * Initialise un album avec les données fournies.
   * @param {Object} jsAlbum - Les données JSON représentant l'album.
   */
  constructor(jsAlbum) {
    if (!jsAlbum) {
      this.name = "Unknown Album"; // Nom de l'album, par défaut
      this.folder = "Unknown Folder"; // Nom du dossier, par défaut
      this.dateRange = "Unknown Date Range"; // Intervalle de dates, par défaut
      this.nVideo = 0; // Nombre de vidéos, par défaut 0
      this.nImages = 0; // Nombre d'images, par défaut 0
      this.albums = []; // Liste des sous-albums, par défaut vide
      this.mainImage = null; // Image principale, par défaut null
      this.album_path = "Unknown Path"; // Chemin de l'album, par défaut
      this.type = "Album"; // Type, toujours "Album"
      this.medias = [];
      return;
    }

    this.name = jsAlbum.name;
    this.folder = jsAlbum.folder;
    this.dateRange = jsAlbum.dateRange;
    this.nVideo = jsAlbum.nVideo;
    this.nImages = jsAlbum.nImages;
    this.albums = jsAlbum.albums;
    this.mainImageURL = Photo.setImageURL(jsAlbum.mainImage.URL, 10);
    this.album_path = jsAlbum.album_path;
    this.type = "Album";
    this.medias = [];
  }

  /**
   * @method addMedia
   * Ajoute un média (photo ou vidéo) à l'album.
   * @param {Object} media - Le média à ajouter.
   */
  async addMedia(media) {
    if (media) {
      if (media.type === "image") {
        const imgMedia = new Photo(media);
        imgMedia.folder = this.folder;
        this.medias.push(imgMedia);
      } else if (media.type === "video") {
        const vidMedia = new Video(media);
        this.medias.push(vidMedia);
      }
    }
  }

  /**
   * @method initAlbum
   * Initialise l'album avec une liste de médias.
   * @param {Array} medias - Liste des médias à ajouter à l'album.
   */
  async initAlbum(medias) {
    let index = 0;
    for (const media of medias) {
      media.index = index++;
      await this.addMedia(media);
    }

    // Déclencher l'événement une fois terminé
    const event = new Event("albumLoaded");
    document.dispatchEvent(event);

    const mediaData = JSON.stringify(this.medias);
    const albumData = JSON.stringify({
      name: this.name,
      folder: this.folder,
      mainImageURL: this.mainImageURL,
    });

    sessionStorage.setItem("currentMedias", mediaData);
    sessionStorage.setItem("currentAlbum", albumData);
  }

  /**
   * @static
   * @method getHoursDifference
   * Calcule la différence en heures entre deux dates.
   * @param {string} date1 - Première date (format "DD/MM/YYYY HH:MM:SS").
   * @param {string} date2 - Deuxième date (format "DD/MM/YYYY HH:MM:SS").
   * @returns {number} Différence en heures entre les deux dates.
   */
  static getHoursDifference(date1, date2) {
    // Fonction pour analyser une date au format "DD/MM/YYYY HH:MM:SS"
    function parseDate(dateString) {
      const [datePart, timePart] = dateString.split(" ");
      const [day, month, year] = datePart.split("/").map(Number);
      const [hours, minutes, seconds] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds); // Mois -1 car 0-indexé
    }

    // Convertir les chaînes en objets Date
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);

    const diffInMs = d1 - d2;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return diffInHours;
  }

  /**
   * @static
   * @method changeMainImage
   * Change l'image principale de l'album.
   * @param {Object} image - Les données de l'image à définir comme principale.
   */
  static async changeMainImage(image) {
    const response = await fetch(`/update-maiImage/${image.name}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newImage: image,
        "album-name": image.album,
        "folder-name": image.folder || "catalogue",
        "image-URL": image.URL,
      }),
    });

    if (response.ok) {
      console.log("Image updated successfully");
      headerImg.src = image.URL;
    } else {
      console.error("Failed to update image");
    }
  }

  /**
   * @static
   * @method addBrowserEvent
   * Ajoute un événement de clic à un média pour afficher une vue détaillée.
   * @param {Object} media - Le média associé à l'événement.
   * @param {HTMLElement} thumbnail - La vignette sur laquelle l'événement est ajouté.
   */
  static addBrowserEvent(media, thumbnail) {
    // Ajout de l'événement au clic gauche
    thumbnail.addEventListener("click", () => {
      // Redirige vers l'URL correspondant au média
      const baseUrl = "/browser"; // URL de base
      const targetUrl = `${baseUrl}/${media.name}`; // Construction de l'URL finale

      sessionStorage.setItem("currentindex", media.index);

      const img = document.createElement("img");
      img.src = "../img/huang-qijun-fqc0C_inosw-unsplash.jpg";

      window.location.href = targetUrl; // Redirection
    });
  }

  /**
   * @static
   * @method generateGoogleMapsLink
   * Génère un lien Google Maps à partir de coordonnées GPS.
   * @param {number} latitude - Latitude.
   * @param {number} longitude - Longitude.
   * @returns {string} Lien Google Maps.
   */
  static generateGoogleMapsLink(latitude, longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

}

/**
 * @class Photo
 * Classe représentant une photo dans un album.
 */
class Photo {
  /**
   * @constructor
   * Initialise une photo avec les données fournies.
   * @param {Object} image - Les données JSON représentant la photo.
   */
  constructor(image) {
    if (!image) {
      return;
    }

    this.name = image.name;
    this.date = this.formatDate(image.date);
    this.album = image.album;
    this.path = image.path;
    this.type = "image";
    this.URL = Photo.setImageURL(image.URL);
    this.GPS_Coordinates = image.GPS_Coordinates;
    this.device = image.device;
    this.address = image.address;
    this.index = image.index;
  }

  /**
   * @static
   * @method createMediaThumbnail
   * Crée une vignette pour une photo.
   * @param {Object} image - Les données de la photo.
   * @returns {HTMLElement} Élément HTML de la vignette.
   */
  static createMediaThumbnail(image) {
    // Créer un élément div pour contenir l'image
    const thumbnailDiv = document.createElement("article");
    thumbnailDiv.className = "thumbnail"; // Ajouter la classe
    thumbnailDiv.dataset.type = "image";
    thumbnailDiv.dataset.name = image.name;
    thumbnailDiv.dataset.date = image.date;
    thumbnailDiv.id = image.name;

    // Créer l'élément img
    const imgElement = document.createElement("img");
    imgElement.className = "thumbnail-img"; // Ajouter la classe
    // imgElement.src = image.URL; // Définir la source de l'image
    // imgElement.loading = "lazy"; // Ajouter l'attribut de chargement
    imgElement.dataset.originalSrc = image.URL; // Stocker l'URL originale pour rechargement
    imgElement.dataset.name = image.name;

    // Ajouter l'élément img au div
    thumbnailDiv.appendChild(imgElement);
    Photo.observeVisibility(imgElement);
    // Ajouter l'événement de gestion des popups via PopupHandler
    PopupHandler.addPopupEvent(image, thumbnailDiv);
    PopupHandler.removeExistingInfoPopup();

    Album.addBrowserEvent(image, thumbnailDiv);
    return thumbnailDiv;
  }

  /**
   * @static
   * @method observeVisibility
   * Observe la visibilité de l'image pour charger dynamiquement son contenu.
   * @param {HTMLElement} imgElement - L'élément image à observer.
   */
  static observeVisibility(imgElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            // Charger l'image avant qu'elle n'entre dans la vue
            if (
              !imgElement.src ||
              imgElement.src !== imgElement.dataset.originalSrc
            ) {
              imgElement.src = imgElement.dataset.originalSrc;
              imgElement.classList.remove("blurred"); // Supprimer le flou une fois chargée
            } else {
              imgElement.src = "";
            }
          }
        });
      },
      {
        rootMargin: "1000px 0px", // Précharge les images 200px avant qu'elles n'entrent dans la vue
        threshold: 0.1, // Déclenche l'observateur dès qu'une petite partie est visible
      }
    );

    // Ajouter une classe floutée au début
    imgElement.classList.add("blurred");

    // Observer l'élément
    observer.observe(imgElement);
  }

  /**
   * @method formatDate
   * Formate une date ISO en un format lisible.
   * @param {string} isoDate - Date au format ISO.
   * @returns {string} Date formatée.
   */
  formatDate(isoDate) {
    const dateObj = new Date(isoDate);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Les mois vont de 0 à 11
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * @method getPopup
   * Retourne une popup contenant les informations de la photo.
   * @returns {HTMLElement} Élément HTML de la popup.
   */
  getPopup() {
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("image-info");
    infoDiv.id = "image-info";
    infoDiv.innerHTML = `
      <div id="image-basic-info">
        <p><strong>Name: </strong><span id="image-info-name">${this.name
      }</span></p>
        <p><strong>Album: </strong><span id="image-info-album">${this.album
      }</span></p>
        <p><strong>Index: </strong><span id="image-info-device">${this.index
      }</span></p>
        <p><strong>Type: </strong><span id="image-info-type">${this.type
      }</span></p>
        <p><strong>Date: </strong><span id="image-info-date">${this.date
      }</span></p>
        <p><strong>Device: </strong><span id="image-info-device">${this.device
      }</span></p>
        <p><strong>Address: </strong><span id="image-info-address" title="${this.address
      }">${this.address}</span></p>
        <p><strong>GPS Coordinates: </strong>
          <a id="image-info-GPS" href="${this.GPS_Coordinates
        ? Album.generateGoogleMapsLink(
          this.GPS_Coordinates[0].toFixed(4),
          this.GPS_Coordinates[1].toFixed(4)
        )
        : "#"
      }" target="_blank">
            ${this.GPS_Coordinates
        ? `${this.GPS_Coordinates[0].toFixed(
          4
        )}, ${this.GPS_Coordinates[1].toFixed(4)}`
        : "Coordonnées non disponibles"
      }
          </a>
        </p>
        <p><strong>Path: </strong><span id="image-info-path" title="${this.path
      }">${this.path}</span></p>
      </div>
    `;

    PopupHandler.addMainImageButton(this, infoDiv);
    return infoDiv;
  }

  /**
   * @static
   * @method calculateQuality
   * Calcule la qualité d'image en fonction de l'écran.
   * @returns {number} Niveau de qualité calculé.
   */
  static calculateQuality() {
    const screenWidth = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;

    if (screenWidth <= 480 && dpr < 3) {
      return 30; // Qualité basse pour petits écrans standard
    } else if (screenWidth <= 480 && dpr >= 3) {
      return 15; // Qualité moyenne pour petits écrans haut de gamme
    } else if (screenWidth <= 1024) {
      return 20; // Qualité moyenne pour tablettes
    } else {
      return 20; // Qualité haute pour grands écrans
    }
  }

  /**
   * @static
   * @method setImageURL
   * Ajoute un paramètre de qualité à l'URL de l'image.
   * @param {string} URL - URL de base de l'image.
   * @param {number} enhance - Amélioration de la qualité (optionnel).
   * @returns {string} URL avec les paramètres ajoutés.
   */
  static setImageURL(URL, enhance = 0) {
    const quality = Photo.calculateQuality();

    return `${URL}&quality=${quality + enhance}`;
  }
}

/**
 * @class Video
 * Classe représentant une vidéo dans un album.
 */
class Video {
  /**
   * @constructor
   * Initialise une vidéo avec les données fournies.
   * @param {Object} video - Les données JSON représentant la vidéo.
   */
  constructor(video) {
    if (!video) {
      return;
    }

    this.name = video.name;
    this.date = this.formatDate(video.date);
    this.album = video.album;
    this.path = video.path;
    this.type = "video";
    this.URL = video.URL;
    this.previewURL = video.previewURL;
    this.index = video.index;
  }

  /**
   * @static
   * @method extractMetadata
   * Extrait les métadonnées d'une vidéo (durée, résolution, etc.).
   * @param {Object} video - L'objet vidéo à enrichir avec les métadonnées.
   */
  static async extractMetadata(video) {
    video.duration = 0;
    video.resolution = "0x0";
  }

  /**
   * @static
   * @method formatDuration
   * Formate une durée en secondes en un format "MM:SS".
   * @param {number} duration - Durée en secondes.
   * @returns {string} Durée formatée.
   */
  static formatDuration(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }

  /**
   * @static
   * @method addVideoEvents
   * Ajoute des événements pour gérer l'interaction avec une vignette vidéo.
   * @param {HTMLElement} thumbnailDiv - Le conteneur de la vignette.
   * @param {HTMLVideoElement} videoElement - L'élément vidéo à contrôler.
   * @param {HTMLElement} durationP - Élément pour afficher la durée.
   * @param {Object} video - L'objet vidéo associé.
   */
  static addVideoEvents(thumbnailDiv, videoElement, durationP, video) {
    // Mettre à jour la durée au fur et à mesure de la lecture
    videoElement.addEventListener("timeupdate", () => {
      durationP.innerHTML = videoElement.currentTime
        ? Video.formatDuration(videoElement.currentTime)
        : video.duration;
    });

    // Survol pour démarrer la lecture
    thumbnailDiv.addEventListener("mouseenter", () => {
      videoElement.play();
    });

    // Quitter le survol pour arrêter la lecture et remettre à zéro
    thumbnailDiv.addEventListener("mouseleave", () => {
      videoElement.pause();
      videoElement.currentTime = 0;
    });
  }

  /**
   * @static
   * @method createMediaThumbnail
   * Crée une vignette HTML pour une vidéo.
   * @param {Object} video - Les données de la vidéo.
   * @returns {HTMLElement} Élément HTML de la vignette.
   */
  static createMediaThumbnail(video) {
    // Créer la structure du thumbnail
    const thumbnailDiv = document.createElement("article");
    thumbnailDiv.className = "thumbnail";
    thumbnailDiv.dataset.type = "video";
    thumbnailDiv.dataset.name = video.name;
    thumbnailDiv.dataset.date = video.date;
    thumbnailDiv.id = video.name;

    // Créer l'élément vidéo
    const videoElement = document.createElement("video");
    videoElement.preload = "none"; // Préchargement désactivé par défaut
    videoElement.dataset.originalSrc = video.URL; // Stocker l'URL dans dataset
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.autoplay = false; // Empêche la lecture automatique
    videoElement.className = "thumbnail-img";

    // Gestion des métadonnées de la vidéo
    videoElement.onloadedmetadata = () => {
      video.duration = Video.formatDuration(videoElement.duration);
      video.resolution = `${videoElement.videoWidth}x${videoElement.videoHeight}`;
      durationP.innerHTML = video.duration; // Mettre à jour l'affichage de la durée
    };

    // Créer l'élément de durée
    const durationP = document.createElement("p");
    durationP.className = "video-duration";
    durationP.innerHTML = "Chargement..."; // Message par défaut avant le chargement

    // Ajouter les éléments au conteneur de vignette
    thumbnailDiv.appendChild(videoElement);
    thumbnailDiv.appendChild(durationP);

    // Ajouter les événements personnalisés pour la vignette vidéo
    Video.addVideoEvents(thumbnailDiv, videoElement, durationP, video);

    // Observer la visibilité pour charger/décharger la vidéo
    Video.observeVisibility(videoElement);

    PopupHandler.addPopupEvent(video, thumbnailDiv);

    Album.addBrowserEvent(video, thumbnailDiv);
    return thumbnailDiv;
  }

  /**
   * @static
   * @method observeVisibility
   * Observe la visibilité de la vidéo pour gérer son chargement/déchargement dynamique.
   * @param {HTMLVideoElement} videoElement - L'élément vidéo à observer.
   */
  static observeVisibility(videoElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Charger la vidéo quand elle est visible
            if (
              !videoElement.src ||
              videoElement.src !== videoElement.dataset.originalSrc
            ) {
              videoElement.src = videoElement.dataset.originalSrc; // Définir la source
              videoElement.load(); // Charger les métadonnées
              videoElement.classList.remove("blurred");
            }
          } else {
            // Supprimer la source quand elle est hors vue
            videoElement.src = ""; // Efface la source pour libérer des ressources
          }
        });
      },
      {
        rootMargin: "200px 0px", // Précharge les vidéos 200px avant qu'elles n'entrent dans la vue
        threshold: 0.1, // Déclenche quand une petite partie est visible
      }
    );

    // Observer l'élément vidéo
    videoElement.classList.add("blurred");
    observer.observe(videoElement);
  }

  /**
   * @method formatDate
   * Formate une date ISO en un format lisible.
   * @param {string} isoDate - Date au format ISO.
   * @returns {string} Date formatée.
   */
  formatDate(isoDate) {
    const dateObj = new Date(isoDate);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Les mois vont de 0 à 11
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * @method getPopup
   * Retourne une popup contenant les informations de la vidéo.
   * @returns {HTMLElement} Élément HTML de la popup.
   */
  getPopup() {
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("image-info");
    infoDiv.id = "image-info";
    infoDiv.innerHTML = `
      <div id="image-basic-info">
        <p><strong>Name: </strong><span id="image-info-name">${this.name}</span></p>
        <p><strong>Album: </strong><span id="image-info-album">${this.album}</span></p>
        <p><strong>Index: </strong><span id="image-info-device">${this.index}</span></p>
        <p><strong>Type: </strong><span id="image-info-type">${this.type}</span></p>
        <p><strong>Date: </strong><span id="image-info-date">${this.date}</span></p>
        <p><strong>Duration: </strong><span id="image-info-device">${this.duration}</span></p>
        <p><strong>Resolution: </strong><span id="image-info-device">${this.resolution}</span></p>
        <p><strong>Path: </strong><span id="image-info-path" title="${this.path}">${this.path}</span></p>
      </div>
    `;

    return infoDiv;
  }
}

/**
 * @class PopupHandler
 * Classe responsable de la gestion des popups pour afficher des informations détaillées sur les médias.
 */
class PopupHandler {
  /**
   * @static
   * @method addPopupEvent
   * Ajoute un événement contextuel (clic droit) pour afficher une popup d'informations.
   * @param {Object} media - L'objet média associé à la popup.
   * @param {HTMLElement} thumbnail - L'élément miniature déclencheur de l'événement.
   */
  static addPopupEvent(media, thumbnail) {
    thumbnail.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      PopupHandler.removeExistingInfoPopup();

      const infoDiv = PopupHandler.createInfoPopup(media, e.pageX, e.pageY);

      document.body.appendChild(infoDiv);

      PopupHandler.setupCloseOnClickOutside(infoDiv);
    });
  }

  /**
   * @static
   * @method removeExistingInfoPopup
   * Supprime la popup d'informations existante, si elle est active.
   */
  static removeExistingInfoPopup() {
    const existingInfo = document.getElementById("image-info");
    if (existingInfo) {
      existingInfo.remove();
    }
  }

  /**
   * @static
   * @method createInfoPopup
   * Crée une popup contenant des informations détaillées sur un média.
   * @param {Object} media - L'objet média associé à la popup.
   * @param {number} posX - Position horizontale de la popup (en pixels).
   * @param {number} posY - Position verticale de la popup (en pixels).
   * @returns {HTMLElement} L'élément HTML de la popup créée.
   */
  static createInfoPopup(media, posX, posY) {
    const infoDiv = media.getPopup();

    const maxPopupWidth = 450;
    const windowWidth = window.innerWidth;
    if (posX > windowWidth / 2) {
      posX = windowWidth - maxPopupWidth - (windowWidth - posX);
      infoDiv.classList.add("image-info-reverse");
    }

    infoDiv.style.left = `${posX}px`;
    infoDiv.style.top = `${posY}px`;

    return infoDiv;
  }

  /**
   * @static
   * @method setupCloseOnClickOutside
   * Configure un gestionnaire pour fermer la popup lorsqu'un clic est effectué en dehors de celle-ci.
   * @param {HTMLElement} infoDiv - L'élément HTML représentant la popup.
   */
  static setupCloseOnClickOutside(infoDiv) {
    document.addEventListener(
      "click",
      () => {
        infoDiv.remove();
      },
      { once: true }
    );
  }

  /**
   * @static
   * @method addMainImageButton
   * Ajoute un bouton permettant de définir une image comme image principale.
   * @param {Object} media - L'objet média associé.
   * @param {HTMLElement} infoDiv - La popup dans laquelle le bouton sera ajouté.
   */
  static addMainImageButton(media, infoDiv) {
    const actionDiv = document.createElement("div");
    actionDiv.id = "action-div-popup";

    const mainImageButton = document.createElement("button");
    mainImageButton.id = "main-image-popup-button";
    mainImageButton.innerHTML = "Choose as main image";
    mainImageButton.addEventListener("click", async () => {
      Album.changeMainImage(media);
    });

    actionDiv.appendChild(mainImageButton);
    infoDiv.appendChild(actionDiv);
  }
}


async function handleSearchAction() {
  const folderPath = document.getElementById("search-input").value;

  if (!folderPath) {
    alert("Veuillez spécifier un dossier.");
    return;
  }

  try {
    const response = await fetch("/reset-catalogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderPath }),
    });

    if (response.ok) {
      const rep = await response.json();
      const imageContainer = document.getElementById("main-content");
      imageContainer.innerHTML = "";

      const album = new Album(rep);
      console.log(album);

      const pageHandler = new PageHandler(album);
      pageHandler.initPage(rep.medias);
    } else {
      const error = await response.json();
      alert(error.error || "Erreur lors du chargement des images.");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

document
  .getElementById("search-icon")
  .addEventListener("click", handleSearchAction);

document
  .getElementById("search-input")
  .addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearchAction();
    }
  });

document.addEventListener("DOMContentLoaded", async () => {
  console.log("La page est entièrement chargée et le DOM est prêt.");
  const urlPath = window.location.pathname;
  const albumName = urlPath
    .substring(urlPath.lastIndexOf("/") + 1)
    .toLowerCase();

  const folderName = sessionStorage.getItem("folder");
  console.log("folderName");
  console.log(folderName);

  let album = null;

  try {
    if (!albumName) {
      return;
    }

    const response = await fetch(`/get-Album/${albumName}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", folderName: folderName },
      signal: signal,
    });

    if (response.ok) {
      const rep = await response.json();
      const imageContainer = document.getElementById("main-content");
      imageContainer.innerHTML = "";

      album = new Album(rep);
      console.log(album);

      const pageHandler = new PageHandler(album);
      pageHandler.initPage(rep.medias);
    } else {
      const error = await response.json();
      alert(error.error || "Erreur lors du chargement des images.");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});

window.addEventListener("beforeunload", () => {
  controller.abort();
});
