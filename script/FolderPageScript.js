const gallery = document.getElementById("main-content");
const albumInfo = document.getElementById("home-element-count");
const folderInfo = document.getElementById("home-element-count");
const folderName = document.getElementById("album-name");

/**
 * @class PageHandler
 * Classe responsable de la gestion et de l'affichage des albums d'un dossier sur la page.
 */
class PageHandler {
  /**
   * @constructor
   * @param {Folder} folder - Le dossier contenant les albums à afficher.
   */
  constructor(folder) {
    if (!folder) {
      return;
    }

    this.folder = folder;
  }

  /**
   * @method initPage
   * Initialise la page avec les albums du dossier et configure les événements.
   */
  initPage() {
    for (const album of this.folder.albums) {
      console.log(album.name);
      album.createThumbnail();
    }

    folderName.addEventListener("click", () => {
      if (document.referrer.includes("/home")) {
        window.history.back(); // Retourne à la page précédente si c'est /home
      } else {
        window.location.href = "/home"; // Redirige vers /home si ce n'est pas le cas
      }
    });

    folderName.innerHTML = this.folder.name;
    folderInfo.innerHTML = `${this.folder.nImages} photos, ${this.folder.nVideo} kvideos`;
  }
}

/**
 * @class Folder
 * Classe représentant un dossier contenant des albums.
 */
class Folder {
  /**
   * @constructor
   * @param {Object} jsFolder - Les données JSON représentant le dossier.
   */
  constructor(jsFolder) {
    this.name = jsFolder.name;
    this.dateRange = jsFolder.dateRange;
    this.nVideo = jsFolder.nVideos;
    this.nImages = jsFolder.nImages;
    this.nAlbums = jsFolder.nAlbums;
    this.mainImagesURL = jsFolder.mainImagesURL;
    this.type = "folder";
    this.albums = [];
  }

  /**
   * @method initfolder
   * Initialise le dossier avec une liste d'albums.
   * @param {Array} jsalbums - Liste des albums en format JSON.
   */
  initfolder(jsalbums) {
    for (const album of jsalbums) {
      const newAlbum = new Album(album, this.name);
      this.albums.push(newAlbum);
    }
  }
}

/**
 * @class Album
 * Classe représentant un album contenant des images et des vidéos.
 */
class Album {
  /**
   * @constructor
   * @param {Object} jsAlbum - Les données JSON représentant l'album.
   * @param {string} folderName - Le nom du dossier contenant cet album.
   */
  constructor(jsAlbum, folderName) {
    this.name = jsAlbum.name;
    this.dateRange = jsAlbum.dateRange;
    this.nVideo = jsAlbum.nVideos;
    this.nImages = jsAlbum.nImages;
    this.mainImageURL = Album.setImageURL(jsAlbum.mainImageURL, 10);
    this.type = "album";
    this.folder = folderName;
  }

  /**
   * @method createThumbnail
   * Crée une vignette pour l'album et l'ajoute à la galerie.
   */
  createThumbnail() {
    // Crée l'élément <article> avec la classe "thumbnail"
    const article = document.createElement("article");
    article.classList.add("thumbnail");

    // Crée l'image avec la classe "thumbnail-img"
    const img = document.createElement("img");
    img.classList.add("thumbnail-img");
    img.src = this.mainImageURL;
    img.loading = "lazy";

    // Crée le div contenant la description
    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("thumbnail-description-div");

    // Crée le <p> pour le nom de l'album
    const albumNameP = document.createElement("p");
    albumNameP.classList.add("thumbnail-album-name");
    albumNameP.textContent = this.name;

    // Crée le <p> pour le nombre de photos
    const photoCountP = document.createElement("p");
    photoCountP.classList.add("thumbnail-date"); //Changer le nom de la class
    photoCountP.textContent = `${this.nVideo + this.nImages} medias`;

    // Ajoute les <p> au div
    descriptionDiv.appendChild(albumNameP);
    descriptionDiv.appendChild(photoCountP);

    // Ajoute l'image et le div au <article>
    article.appendChild(img);
    article.appendChild(descriptionDiv);

    // Ajoute un gestionnaire d'événement pour rediriger vers la page de l'album
    article.addEventListener("click", () => {
      window.location.href = `/album/${this.name}`;
    });

    // Ajoute l'article au conteneur "gallery"
    PopupHandler.addPopupEvent(this, article);
    gallery.appendChild(article);
  }

  /**
   * @static
   * @method calculateQuality
   * Calcule la qualité des images en fonction de l'écran.
   * @returns {number} Le niveau de qualité calculé.
   */
  static calculateQuality() {
    const screenWidth = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;

    if (screenWidth <= 480 && dpr < 3) {
      return 30; // Qualité basse pour petits écrans standard
    } else if (screenWidth <= 480 && dpr >= 3) {
      return 15; // Qualité moyenne pour petits écrans haut de gamme
    } else if (screenWidth <= 1024) {
      return 50; // Qualité moyenne pour tablettes
    } else {
      return 75; // Qualité haute pour grands écrans
    }
  }

  /**
   * @static
   * @method setImageURL
   * Ajoute un paramètre de qualité à l'URL de l'image.
   * @param {string} URL - URL de l'image.
   * @param {number} enhance - Amélioration de la qualité (optionnel).
   * @returns {string} URL avec les paramètres ajoutés.
   */
  static setImageURL(URL, enhance = 0) {
    const quality = Album.calculateQuality();

    return `${URL}&quality=${quality + enhance}`;
  }

  /**
   * @method getPopup
   * Retourne une popup contenant des informations sur l'album.
   * @returns {HTMLElement} Élément HTML de la popup.
   */
  getPopup() {
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("image-info");
    infoDiv.id = "image-info";
    infoDiv.innerHTML = `
      <div id="image-basic-info">
        <p><strong>Name: </strong><span id="image-info-name">${this.name}</span></p>
        <p><strong>Folder: </strong><span id="image-info-album">Catalogue</span></p>
        <p><strong>Type: </strong><span id="image-info-type">${this.type}</span></p>
        <p><strong>First photo: </strong><span id="image-info-date">${this.dateRange[0]}</span></p>
        <p><strong>Last photo: </strong><span id="image-info-date">${this.dateRange[1]}</span></p>
        <p><strong>Photo count: </strong><span id="image-info-date">${this.nImages}</span></p>
        <p><strong>Video count: </strong><span id="image-info-date">${this.nVideo}</span></p>
      </div>
    `;

    return infoDiv;
  }
}

/**
 * @class PopupHandler
 * Gère les interactions et l'affichage des popups d'informations.
 */
class PopupHandler {
  static isPopupActive = false;

  /**
   * @static
   * @method createInfoPopup
   * Crée une popup d'informations à une position spécifique.
   * @param {Object} item - L'élément associé à la popup.
   * @param {number} posX - Position horizontale de la popup.
   * @param {number} posY - Position verticale de la popup.
   * @returns {HTMLElement} L'élément HTML de la popup créée.
   */
  static addPopupEvent(item, thumbnail) {
    thumbnail.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      PopupHandler.removeExistingInfoPopup();

      const infoDiv = PopupHandler.createInfoPopup(item, e.pageX, e.pageY);

      document.body.appendChild(infoDiv);
      PopupHandler.isPopupActive = true; // Marque la popup comme active

      PopupHandler.setupCloseOnClickOutside(infoDiv);
    });
  }

  /**
   * @static
   * @method setupCloseOnClickOutside
   * Configure un événement pour fermer la popup lorsqu'un clic est effectué en dehors de celle-ci.
   * @param {HTMLElement} infoDiv - L'élément HTML représentant la popup.
   */
  static removeExistingInfoPopup() {
    const existingInfo = document.getElementById("image-info");
    if (existingInfo) {
      existingInfo.remove();
      PopupHandler.isPopupActive = false; // Marque la popup comme inactive
    }
  }

  /**
   * @static
   * @method createInfoPopup
   * Crée une popup d'informations pour un élément à une position donnée.
   * @param {Object} item - L'élément pour lequel afficher la popup. Doit implémenter une méthode `getPopup`.
   * @param {number} posX - Position horizontale de la popup (en pixels).
   * @param {number} posY - Position verticale de la popup (en pixels).
   * @returns {HTMLElement} L'élément HTML de la popup créée.
   */
  static createInfoPopup(item, posX, posY) {
    const infoDiv = item.getPopup();

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
   * Configure un gestionnaire d'événement pour fermer la popup lorsqu'un clic est effectué en dehors de celle-ci.
   * @param {HTMLElement} infoDiv - L'élément HTML représentant la popup.
   */
  static setupCloseOnClickOutside(infoDiv) {
    document.addEventListener(
      "click",
      (e) => {
        // Vérifie si le clic est à l'intérieur de la popup
        if (infoDiv.contains(e.target)) {
          return; // Ne ferme pas la popup
        }

        infoDiv.remove();
        PopupHandler.isPopupActive = false; // Marque la popup comme inactive
      },
      { once: true }
    );
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

/**
 * @event pageshow
 * Événement déclenché chaque fois que la page est affichée (même depuis le cache du navigateur).
 */
window.addEventListener("pageshow", async () => {
  console.log("La page est entièrement chargée et le DOM est prêt.");

  const urlPath = window.location.pathname; // "/album/Icons"
  const folderName = urlPath
    .substring(urlPath.lastIndexOf("/") + 1)
    .toLowerCase();

  try {
    const response = await fetch(`/get-Folder/${folderName}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const rep = await response.json();
      gallery.innerHTML = "";

      const folder = new Folder(rep);
      await folder.initfolder(rep.albums);
      console.log(folder);

      const pageHandler = new PageHandler(folder);
      pageHandler.initPage();
    } else {
      const error = await response.json();
      alert(error.error || "Erreur lors du chargement des images.");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }

  console.log("sessionStorage Update");

  sessionStorage.setItem("folder", folderName);
});
