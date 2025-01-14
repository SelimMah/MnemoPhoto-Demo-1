const headerImg = document.getElementById("header-img");
const headerAlbumName = document.getElementById("header-album-name");
const header = document.querySelector("header");
const mainContent = document.getElementById("main-content");
const mainVideo = document.getElementById("main-video");
const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");
const mediaPreviewer = document.getElementById("media-previewer");
const mediaPreviewerCarousel = document.getElementById(
  "media-previewer-carousel"
);
let mediaElements = document.querySelectorAll(
  ".media-container video, .media-container img"
);
let customControls = document.querySelectorAll(".custom-controls");

let inactivityTimer;

/**
 * @class PageHandler
 * Classe principale pour gérer la logique de la page, y compris les carrousels et les conteneurs médias.
 */
class PageHandler {
  /**
   * @constructor
   * Initialise les variables nécessaires pour gérer la page.
   */
  constructor() {
    this.album;
    this.index = 0;
    this.previewIndex = 0;
    this.firstMedia = null;
    this.mainContainer = null;
    this.previewContainerWidth = 0;
  }

  /**
   * @method initPage
   * Initialise la page avec l'album et les événements utilisateur.
   */
  initPage() {
    headerImg.src = this.album.mainImageURL;

    this.index = Number(sessionStorage.getItem("currentindex")) || 0;
    this.previewIndex = Number(sessionStorage.getItem("currentindex")) || 0;
    this.firstMedia = this.album.medias[this.index];
    this.firstMedia.isFirst = true;

    this.insertMediaContainers();

    this.updateCarousel();

    const images = document.querySelectorAll(".media-container");

    leftButton.addEventListener("click", () => {
      this.index = (this.index - 1 + images.length) % images.length;
      this.updateCarousel();
    });

    rightButton.addEventListener("click", () => {
      this.index = (this.index + 1) % images.length;
      this.updateCarousel();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        this.index = (this.index - 1 + images.length) % images.length;
        this.updateCarousel();
      } else if (event.key === "ArrowRight") {
        this.index = (this.index + 1) % images.length;
        this.updateCarousel();
      }
    });

    headerAlbumName.innerHTML = this.album.name;
    header.addEventListener("click", () => {
      window.history.back(); // Retourne à la page précédente dans l'historique
    });

    mediaPreviewer.addEventListener("wheel", (event) => {
      // Normaliser la direction de défilement
      const direction = event.deltaY > 0 ? -1 : 1;
      console.log(direction); // Affiche 1 ou -1 dans la console
      // this.previewIndex += direction;
      const images = document.querySelectorAll(".media-container");

      this.previewIndex += direction;

      // Empêcher l'indice de dépasser la longueur ou d'être négatif
      if (this.previewIndex < 0) {
        this.previewIndex = 0; // Bloque à 0 si en dessous
      } else if (this.previewIndex >= images.length) {
        this.previewIndex = images.length - 1; // Bloque au dernier indice si au-dessus
      }

      PageHandler.centerPreviewElement(this.previewIndex);
    });
  }

  /**
   * @static
   * @method setImageURL
   * Modifie ou ajoute un paramètre de qualité à l'URL d'une image.
   * @param {string} inputURL - URL de l'image.
   * @param {number} quality - Niveau de qualité (par défaut 100).
   * @returns {string} URL modifiée avec le paramètre de qualité.
   */
  static setImageURL(inputURL, quality = 100) {
    try {
      // Vérifier si l'URL est absolue ou relative
      const base = window.location.origin; // Nécessaire pour les URL relatives
      const url = new URL(inputURL, base);

      // Vérifier si le paramètre 'quality' existe déjà
      if (url.searchParams.has("quality")) {
        // Modifier la valeur de 'quality'
        url.searchParams.set("quality", quality);
      } else {
        // Ajouter le paramètre 'quality' si absent
        url.searchParams.append("quality", quality);
      }

      return url.toString();
    } catch (error) {
      console.error("Erreur dans la manipulation de l'URL :", error);
      throw error; // Rejeter avec une erreur si l'URL est invalide
    }
  }

  /**
   * @static
   * @method centerPreviewElement
   * Centre un élément dans le carrousel de prévisualisation.
   * @param {number} index - Index de l'élément à centrer.
   */
  static centerPreviewElement(index) {
    const carouselItems = document.querySelectorAll(".preview-container");
    const element = carouselItems[index]; // Deuxième élément (index 1)

    const carousel = document.getElementById("media-previewer-carousel");

    if (!carousel || !element) {
      console.error(
        "L'élément du carrousel ou le carrousel lui-même est introuvable."
      );
      return;
    }

    // Calculer l'offset pour centrer l'élément (par rapport à l'origine, sans accumulation)
    const carouselCenter = carousel.offsetWidth / 2;
    const elementCenter = element.offsetLeft + element.offsetWidth / 2;
    const width =
      Math.min(
        element.offsetWidth,
        carouselItems[carouselItems.length - 1].offsetWidth,
        carouselItems[0].offsetWidth
      ) * 0.5;
    console.log(width);

    const offset = carouselCenter - elementCenter + width;
    // Appliquer la transformation pour recentrer
    carousel.style.transform = `translateX(${offset}px)`;

    PageHandler.customHtmlTraversal(
      mediaPreviewerCarousel,
      index,
      12,
      PageHandler.updatePreviewContainer
    );
  }

  /**
   * @method updateCarousel
   * Met à jour le carrousel principal avec le média actif.
   */
  updateCarousel() {
    PageHandler.customHtmlTraversal(mainContent, this.index);

    this.previewIndex = this.index;

    sessionStorage.setItem("currentindex", this.index);

    this.resetMainContainer();

    const offset = -this.index * 100; // Déplace l'affichage selon l'image active
    mainContent.style.transform = `translateX(${offset}%)`;

    PageHandler.centerPreviewElement(this.index);
    console.log(this.index);
  }

  /**
   * @method resetMainContainer
   * Réinitialise le conteneur principal en supprimant les attributs ID et en arrêtant les vidéos actives.
   */
  resetMainContainer() {
    const container = document.getElementById("main-container");
    let controls = "";

    if (container) {
      const video = container.querySelector("video");
      if (video) {
        video.pause();
        video.currentTime = 0;
        const playPauseButton = container.querySelector(".play-pause");
        playPauseButton.innerHTML = '<div class="play-icon"></div>';
      }
    }

    const element = document.getElementById("main-container");
    if (element) {
      element.removeAttribute("id");
    }

    const children = Array.from(mainContent.children);
    this.mainContainer = children[this.index];
    if (this.mainContainer) {
      this.mainContainer.id = "main-container";
    }

    console.log(this.mainContainer);
  }

  /**
   * @method insertMediaContainers
   * Insère les conteneurs de médias dans le contenu principal et la prévisualisation.
   */
  insertMediaContainers() {
    // Crée une liste de conteneurs pour les médias
    const mediaContainers = this.album.medias.map((media) => {
      mainContent.appendChild(media.getMediaContainer());
      const preview = media.getPreviewContainer();
      mediaPreviewerCarousel.appendChild(preview);
    });
  }

  /**
   * @static
   * @method updateMediaContainer
   * Met à jour le contenu d'un conteneur média (image ou vidéo) dans la galerie principale.
   * @param {HTMLElement} mediaContainer - Conteneur HTML à mettre à jour.
   */
  static updateMediaContainer(mediaContainer) {
    // Vérifie si le conteneur contient déjà un élément enfant (image ou vidéo)
    if (mediaContainer.children.length > 0) {
      return; // Sort de la fonction sans rien faire
    }

    if (mediaContainer.dataset.type == "image") {
      Photo.updateMediaContainer(mediaContainer);
    } else if (mediaContainer.dataset.type == "video") {
      Video.updateMediaContainer(mediaContainer);
    }
  }

  /**
   * @static
   * @method updatePreviewContainer
   * Met à jour le contenu d'un conteneur de prévisualisation (image ou vidéo).
   * @param {HTMLElement} mediaContainer - Conteneur HTML à mettre à jour.
   */
  static updatePreviewContainer(mediaContainer) {
    // Vérifie si le conteneur contient déjà un élément enfant (image ou vidéo)
    if (mediaContainer.children.length > 0) {
      return; // Sort de la fonction sans rien faire
    }

    if (mediaContainer.dataset.type == "image") {
      Photo.updatePreviewContainer(mediaContainer);
    } else if (mediaContainer.dataset.type == "video") {
      Video.updatePreviewContainer(mediaContainer);
    }
  }

  /**
   * @static
   * @method customHtmlTraversal
   * Parcourt les éléments adjacents dans le DOM et applique une méthode de mise à jour.
   * @param {HTMLElement} element - Conteneur des éléments à parcourir.
   * @param {number} startIndex - Index de départ.
   * @param {number} adjacentCount - Nombre d'éléments adjacents à inclure (par défaut 4).
   * @param {Function} updateMethod - Méthode pour mettre à jour les éléments.
   * @returns {Array} Liste des éléments visités.
   */
  static customHtmlTraversal(
    element,
    startIndex,
    adjacentCount = 4,
    updateMethod = PageHandler.updateMediaContainer
  ) {
    const children = Array.from(element.children);
    let visited = [];
    let left = startIndex - 1;
    let right = startIndex + 1;
    const length = children.length;

    // Ajouter l'élément de départ
    if (children[startIndex]) {
      visited.push(children[startIndex]);
    }

    // Parcourir les éléments adjacents
    while (visited.length < adjacentCount + 1) {
      // +1 inclut l'élément de départ
      if (visited.length < adjacentCount + 1) {
        // Gérer le dépassement par la droite (rebouclage à gauche)
        right = (right + length) % length;
        visited.push(children[right]);
        right++;
      }
      if (visited.length < adjacentCount + 1) {
        // Gérer le dépassement par la gauche (rebouclage à droite)
        left = (left + length) % length;
        visited.push(children[left]);
        left--;
      }
    }

    // Mettre à jour les éléments avec la méthode fournie
    visited.forEach((child) => {
      updateMethod(child);
    });

    return visited;
  }

  /**
   * @static
   * @method hideElements
   * Masque les éléments interactifs (boutons de navigation, prévisualisation, contrôles).
   */
  static hideElements() {
    const container = document.getElementById("main-container");
    let controls = "";
    let mediaElement = "";

    if (container) {
      mediaElement = container.querySelector("video, img");
      controls = container.querySelector(".custom-controls");

      mediaElement.style.borderRadius = "0px"; // Remplacez "15px" par la valeur souhaitée
    }

    // Vérifier si le curseur est sur l'un des éléments à cacher
    const isCursorOverElement = [
      leftButton,
      rightButton,
      mediaPreviewer,
      controls,
    ].some((element) => {
      return element && element.matches(":hover"); // Vérifie si l'élément est survolé
    });

    if (isCursorOverElement) {
      return; // Ne pas cacher les éléments si le curseur est dessus
    }

    // Cacher les éléments si le curseur n'est pas dessus
    leftButton.style.opacity = "0";
    rightButton.style.opacity = "0";
    mediaPreviewer.style.opacity = "0";
    if (controls) {
      controls.style.opacity = "0";
      mediaElement.style.borderRadius = "0px";
    }

    setTimeout(() => {
      leftButton.style.display = "none";
      rightButton.style.display = "none";
      mediaPreviewer.style.display = "none";
    }, 300); // Durée égale à celle de la transition
  }

  /**
   * @static
   * @method showElements
   * Affiche les éléments interactifs (boutons de navigation, prévisualisation, contrôles).
   */
  static showElements() {
    const container = document.getElementById("main-container");
    let controls = "";

    if (container) {
      const mediaElement = container.querySelector("video, img");
      controls = container.querySelector(".custom-controls");

      mediaElement.style.borderRadius = "12px"; // Remplacez "15px" par la valeur souhaitée
    }

    leftButton.style.display = "block";
    rightButton.style.display = "block";
    mediaPreviewer.style.display = "flex";
    setTimeout(() => {
      leftButton.style.opacity = "1";
      rightButton.style.opacity = "1";
      mediaPreviewer.style.opacity = "1";

      if (controls) {
        controls.style.opacity = "1";
      }
    }, 10); // Légère pause pour permettre l'animation
  }

  /**
   * @static
   * @method resetTimer
   * Réinitialise le timer d'inactivité et affiche les éléments interactifs.
   */
  static resetTimer() {
    // Réinitialiser l'affichage
    PageHandler.showElements();

    // Réinitialiser le timer
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(PageHandler.hideElements, 2000); // 4 secondes
  }

  /**
   * @static
   * @method fadeIN
   * Applique une animation de fondu d'entrée pour introduire la page.
   */
  static fadeIN() {
    const fadeDuration = 500; // Durée du fondu en millisecondes

    // Créez un overlay pour le fondu
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "1";
    overlay.style.transition = `opacity ${fadeDuration}ms ease`;
    overlay.style.zIndex = "2000";

    // Ajoutez l'overlay à la page
    document.body.appendChild(overlay);

    // Lancez l'animation de disparition du fondu
    setTimeout(() => {
      overlay.style.opacity = "0";
    }, 50);

    // Supprimez l'overlay après l'animation
    setTimeout(() => {
      overlay.remove();
    }, fadeDuration + 50);
  }
}

const pageHandler = new PageHandler();

/**
 * @class Album
 * Classe représentant un album contenant des médias (photos et vidéos).
 */
class Album {
  /**
   * @constructor
   * Initialise un album avec les données fournies.
   * @param {Object} jsAlbum - Les données JSON représentant l'album.
   * @property {string} name - Nom de l'album.
   * @property {string} folder - Nom du dossier contenant l'album.
   * @property {string} mainImageURL - URL de l'image principale de l'album.
   * @property {string} type - Type de l'album (toujours "Album").
   * @property {Array} medias - Liste des médias (photos et vidéos) inclus dans l'album.
   */
  constructor(jsAlbum) {
    this.name = jsAlbum.name;
    this.folder = jsAlbum.folder;
    this.mainImageURL = jsAlbum.mainImageURL;
    this.type = "Album";
    this.medias = [];
  }

  /**
   * @method initAlbum
   * Initialise l'album en ajoutant une liste de médias.
   * @param {Array} medias - Liste des médias (photos et vidéos) à ajouter à l'album.
   */
  async initAlbum(medias) {
    for (const media of medias) {
      await this.addMedia(media);
    }
  }

  /**
   * @method addMedia
   * Ajoute un média (photo ou vidéo) à l'album.
   * @param {Object} media - Les données du média à ajouter.
   */
  async addMedia(media) {
    if (media) {
      if (media.type === "image") {
        const imgMedia = new Photo(media);
        this.medias.push(imgMedia);
      } else if (media.type === "video") {
        const vidMedia = new Video(media);
        this.medias.push(vidMedia);
      }
    }
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
    this.date = image.date;
    this.album = image.album;
    this.path = image.path;
    this.type = "image";
    this.URL = image.URL;
    this.GPS_Coordinates = image.GPS_Coordinates;
    this.device = image.device;
    this.address = image.address;
    this.index = image.index;
    this.isFirst = false;
  }

  /**
   * @method getMediaContainer
   * Crée un conteneur HTML pour afficher la photo dans la galerie.
   * @returns {HTMLElement} Conteneur HTML contenant la photo.
   */
  getMediaContainer() {
    const mediaUrl = PageHandler.setImageURL(this.URL);

    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-container";
    mediaContainer.setAttribute("data-url", mediaUrl);

    const p = document.createElement("p");
    p.innerHTML = this.name;

    if (this.isFirst) {
      //-----------------------------------------------------------------
      mediaContainer.id = "main-container";
      let mediaElement = null;

      mediaElement = document.createElement("img");
      mediaElement.alt = "Image"; // Modifiez l'attribut alt selon vos besoins

      mediaElement.src = mediaUrl;
      mediaContainer.setAttribute("data-url", mediaUrl);

      setTimeout(() => {
        mainContent.style.transition = "transform 0.5s ease-in-out";
        PageHandler.customHtmlTraversal(
          mainContent,
          this.index,
          mediaPreviewerCarousel
        );
      }, 50); // Délai de 50ms (0.05 seconde)

      // mediaContainer.id = "main-container";
      mediaContainer.appendChild(mediaElement);
    } else {
      mediaContainer.setAttribute("data-type", "image");
    }

    return mediaContainer;
  }

  /**
   * @static
   * @method updateMediaContainer
   * Met à jour un conteneur média pour y insérer une photo.
   * @param {HTMLElement} mediaContainer - Conteneur HTML à mettre à jour.
   */
  static updateMediaContainer(mediaContainer) {
    const imgElement = document.createElement("img");
    imgElement.alt = "Image"; // Modifiez l'attribut alt selon vos besoins
    imgElement.src = mediaContainer.dataset.url;

    // Ajoute l'élément img à la div
    mediaContainer.appendChild(imgElement);
  }

  /**
   * @method getPreviewContainer
   * Crée un conteneur HTML pour afficher un aperçu de la photo.
   * @returns {HTMLElement} Conteneur HTML pour l'aperçu.
   */
  getPreviewContainer() {
    const mediaUrl = PageHandler.setImageURL(this.URL, 5);

    const previewContainer = document.createElement("div");
    previewContainer.className = "preview-container";
    previewContainer.setAttribute("data-url", mediaUrl);
    previewContainer.setAttribute("data-type", "image");

    previewContainer.addEventListener("click", () => {
      pageHandler.index = this.index;
      pageHandler.updateCarousel();
    });

    return previewContainer;
  }

  /**
   * @static
   * @method updatePreviewContainer
   * Met à jour un conteneur de prévisualisation pour y insérer une photo.
   * @param {HTMLElement} previewContainer - Conteneur HTML à mettre à jour.
   */
  static updatePreviewContainer(previewContainer) {
    const imgElement = document.createElement("img");
    imgElement.className = "preview-media";
    imgElement.alt = "Image"; // Modifiez l'attribut alt selon vos besoins
    imgElement.src = previewContainer.dataset.url;

    // Ajoute l'élément img à la div
    previewContainer.appendChild(imgElement);
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
    this.date = video.date;
    this.album = video.album;
    this.path = video.path;
    this.type = "video";
    this.URL = video.URL;
    this.previewURL = video.previewURL;
    this.index = video.index;
    this.isFirst = false;
  }

  /**
   * @method getMediaContainer
   * Crée un conteneur HTML pour afficher la vidéo dans la galerie.
   * @returns {HTMLElement} Conteneur HTML contenant la vidéo.
   */
  getMediaContainer() {
    const mediaUrl = PageHandler.setImageURL(this.URL);

    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-container";
    mediaContainer.setAttribute("data-url", mediaUrl);

    if (this.isFirst) {
      //-----------------------------------------------------------------

      mediaContainer.id = "main-container";

      const mediaElement = document.createElement("video");
      mediaElement.alt = "Video"; // Modifiez l'attribut alt selon vos besoins
      mediaElement.preload = "metadata"; // Précharge uniquement les métadonnées
      mediaElement.loop = true;

      customControls = Video.getVideoControl(mediaElement);

      mediaElement.src = mediaUrl;
      mediaContainer.setAttribute("data-url", mediaUrl);

      setTimeout(() => {
        mainContent.style.transition = "transform 0.5s ease-in-out";
        PageHandler.customHtmlTraversal(
          mainContent,
          this.index,
          mediaPreviewerCarousel
        );
      }, 50); // Délai de 50ms (0.05 seconde)

      mediaContainer.id = "main-container";
      mediaContainer.appendChild(mediaElement);
      mediaContainer.appendChild(customControls);
    } else {
      mediaContainer.setAttribute("data-type", "video");
    }

    return mediaContainer;
  }

  /**
   * @static
   * @method updateMediaContainer
   * Met à jour un conteneur média pour y insérer une vidéo.
   * @param {HTMLElement} mediaContainer - Conteneur HTML à mettre à jour.
   */
  static updateMediaContainer(mediaContainer) {
    // Crée un élément video avec l'URL
    const videoElement = document.createElement("video");
    // videoElement.controls = true; // Ajoute des contrôles pour la vidéo
    videoElement.preload = "metadata"; // Précharge uniquement les métadonnées
    videoElement.src = mediaContainer.dataset.url;
    videoElement.loop = true;

    // Ajoute l'élément video à la div
    mediaContainer.appendChild(videoElement);

    mediaContainer.appendChild(Video.getVideoControl(videoElement));
  }

  /**
   * @static
   * @method getVideoControl
   * Génère les contrôles personnalisés pour une vidéo.
   * @param {HTMLVideoElement} videoElement - Élément vidéo à associer aux contrôles.
   * @returns {HTMLElement} Conteneur HTML des contrôles personnalisés.
   */
  static getVideoControl(videoElement) {
    const customControlsHTML = `
        <div class="custom-controls">
            <div class="controls">
                <button class="play-pause">
                    <div class="play-icon"></div>
                </button>
                <span class="time-code">0:20 </span>
                <span class="video-duration">/ 0:663</span>
                <div class="volume-control">
                    <input type="range" class="volume-bar" value="0" min="0" max="100" />
                    <button class="mute">
                        <div class="volume_up-icon"></div>
                    </button>
                </div>
                <button class="fullscreen">
                    <div class="fit_screen-icon"></div>
                </button>
            </div>
            <input type="range" class="seek-bar" value="0" min="0" max="100" />
        </div>
    `;

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = customControlsHTML;
    const customControls = tempContainer.firstElementChild;

    Video.initializeVideoControls(customControls, videoElement);
    return customControls;
  }

  /**
   * @static
   * @method initializeVideoControls
   * Initialise les événements pour les contrôles personnalisés d'une vidéo.
   * @param {HTMLElement} customControls - Conteneur des contrôles.
   * @param {HTMLVideoElement} videoElement - Élément vidéo associé.
   */
  static initializeVideoControls(customControls, videoElement) {
    const playPauseButton = customControls.querySelector(".play-pause");
    const muteButton = customControls.querySelector(".mute");
    const volumeBar = customControls.querySelector(".volume-bar");
    const timeCode = customControls.querySelector(".time-code");
    const durationElement = customControls.querySelector(".video-duration");
    const seekBar = customControls.querySelector(".seek-bar");
    const fullscreenButton = customControls.querySelector(".fullscreen");

    // Gestion Lecture/Pause via clic sur la vidéo
    videoElement.addEventListener("click", () =>
      Video.togglePlayPause(videoElement, playPauseButton)
    );
    console.log("efaaf");

    // Gestion Lecture/Pause via le bouton
    playPauseButton.addEventListener("click", () =>
      Video.togglePlayPause(videoElement, playPauseButton)
    );

    // Gestion Lecture/Pause via le clavier
    document.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault(); // Empêche le défilement de la page pour "Espace"

        // Vérifie si l'élément parent de la vidéo a pour id "main-container"
        if (
          videoElement.parentElement &&
          videoElement.parentElement.id === "main-container"
        ) {
          Video.togglePlayPause(videoElement, playPauseButton);
        }
      }
    });

    // Gestion Son (muet)
    muteButton.addEventListener("click", () => {
      videoElement.muted = !videoElement.muted;
      Video.updateMuteIcon(videoElement, muteButton);
    });

    // Gestion de la barre de volume
    volumeBar.addEventListener("input", () => {
      videoElement.volume = volumeBar.value / 100;
    });

    // Gestion du volume via la molette de la souris
    [muteButton, volumeBar].forEach((element) => {
      element.addEventListener("wheel", (event) => {
        event.preventDefault();
        const delta = event.deltaY; // Sens du défilement
        let newVolume = videoElement.volume;

        if (delta > 0) {
          newVolume = Math.max(0, videoElement.volume - 0.05); // Diminue le volume
        } else if (delta < 0) {
          newVolume = Math.min(1, videoElement.volume + 0.05); // Augmente le volume
        }

        videoElement.volume = newVolume;
        volumeBar.value = newVolume * 100; // Synchronise la barre de volume
        Video.updateMuteIcon(videoElement, muteButton); // Met à jour l'icône muet/non muet
      });
    });

    // Mise à jour de la barre de progression et du temps actuel
    videoElement.addEventListener("timeupdate", () => {
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      seekBar.value = progress;

      // Mettre à jour le time-code
      timeCode.textContent = Video.formatDuration(videoElement.currentTime);
    });

    // Mettre à jour la durée totale après le chargement des métadonnées
    videoElement.addEventListener("loadedmetadata", () => {
      durationElement.textContent = `/ ${Video.formatDuration(
        videoElement.duration
      )}`;
    });

    // Permettre à l'utilisateur de naviguer dans la vidéo via la seek-bar
    seekBar.addEventListener("input", () => {
      const newTime = (seekBar.value / 100) * videoElement.duration;
      videoElement.currentTime = newTime;
    });

    // Gestion du mode plein écran
    fullscreenButton.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        videoElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Initialiser l'état des boutons au chargement
    videoElement.addEventListener("loadeddata", () => {
      Video.updatePlayPauseIcon(videoElement, playPauseButton);
      Video.updateMuteIcon(videoElement, muteButton);
      volumeBar.value = videoElement.volume * 100;
      timeCode.textContent = "0:00";
      videoElement.disableRemotePlayback = true;
    });
  }
  /**
   * @static
   * @method formatDuration
   * Formate une durée en secondes au format "MM:SS".
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
   * @method updatePlayPauseIcon
   * Met à jour l'icône du bouton Lecture/Pause en fonction de l'état de la vidéo.
   * @param {HTMLVideoElement} videoElement - Élément vidéo.
   * @param {HTMLElement} playPauseButton - Bouton Lecture/Pause.
   */
  static updatePlayPauseIcon(videoElement, playPauseButton) {
    playPauseButton.innerHTML = videoElement.paused
      ? '<div class="play-icon"></div>'
      : '<div class="pause-icon"></div>';
  }

  /**
   * @static
   * @method updateMuteIcon
   * Met à jour l'icône du bouton Muet en fonction de l'état de la vidéo.
   * @param {HTMLVideoElement} videoElement - Élément vidéo.
   * @param {HTMLElement} muteButton - Bouton Muet.
   */
  static updateMuteIcon(videoElement, muteButton) {
    muteButton.innerHTML = videoElement.muted
      ? '<div class="volume_off-icon"></div>'
      : '<div class="volume_up-icon"></div>';
  }

  /**
   * @static
   * @method togglePlayPause
   * Alterne entre lecture et pause pour une vidéo.
   * @param {HTMLVideoElement} videoElement - Élément vidéo à contrôler.
   * @param {HTMLElement} playPauseButton - Bouton Lecture/Pause à mettre à jour.
   */
  static togglePlayPause(videoElement, playPauseButton) {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
    Video.updatePlayPauseIcon(videoElement, playPauseButton);
  }

  /**
   * @method getPreviewContainer
   * Crée un conteneur HTML pour afficher une prévisualisation de la vidéo.
   * @returns {HTMLElement} Conteneur HTML pour la prévisualisation.
   */
  getPreviewContainer() {
    const mediaUrl = PageHandler.setImageURL(this.previewURL, 5);

    const previewContainer = document.createElement("div");
    previewContainer.className = "preview-container";
    previewContainer.setAttribute("data-url", mediaUrl);
    previewContainer.setAttribute("data-type", "video");

    previewContainer.addEventListener("click", () => {
      pageHandler.index = this.index;
      pageHandler.updateCarousel();
    });

    return previewContainer;
  }

  /**
   * @static
   * @method updatePreviewContainer
   * Met à jour un conteneur de prévisualisation pour afficher une image associée à une vidéo.
   * @param {HTMLElement} previewContainer - Conteneur HTML à mettre à jour.
   */
  static async updatePreviewContainer(previewContainer) {
    const imgElement = document.createElement("img");
    imgElement.className = "preview-media";
    imgElement.alt = "Video"; // Modifiez l'attribut alt selon vos besoins
    imgElement.src = previewContainer.dataset.url;

    // Ajoute l'élément img à la div
    previewContainer.appendChild(imgElement);
  }
}

window.addEventListener("pageshow", async () => {
  PageHandler.fadeIN();

  document.addEventListener("mousemove", PageHandler.resetTimer);
  document.addEventListener("keydown", PageHandler.resetTimer);
  document.addEventListener("click", PageHandler.resetTimer);

  // Initialiser le timer dès le chargement de la page
  PageHandler.resetTimer();

  // Récupérez les données depuis le sessionStorage
  const currentMedias = JSON.parse(sessionStorage.getItem("currentMedias"));
  const currentAlbum = JSON.parse(sessionStorage.getItem("currentAlbum"));

  const album = {
    name: currentAlbum.name,
    folder: currentAlbum.folder,
    medias: currentMedias,
    mainImageURL: currentAlbum.mainImageURL,
  };

  const Nalbum = new Album(album);
  await Nalbum.initAlbum(album.medias);
  console.log(Nalbum);

  // Nalbum.medias[4].isFirst = true;
  // mainContent.appendChild(Nalbum.medias[4].getMediaContainer());

  pageHandler.album = Nalbum;
  pageHandler.initPage();
  console.log(pageHandler);
});
