const gallery = document.getElementById("home-content");
const albumInfo = document.getElementById("home-element-count");
const catalogueInfo = document.getElementById("home-element-count");

/**
 * @class PageHandler
 * Classe responsable de la gestion et de l'affichage du catalogue sur la page d'accueil.
 */
class PageHandler {
  /**
   * @constructor
   * @param {Catalogue} catalogue - Le catalogue à afficher sur la page.
   */
  constructor(catalogue) {
    if (!catalogue) {
      return;
    }

    this.homecatalogue = catalogue;
  }

  /**
   * @method initPage
   * Initialise la page d'accueil en affichant les éléments du catalogue.
   */
  initPage() {
    for (const element of this.homecatalogue.catalogue) {
      console.log(element.name);
      element.createThumbnail();
    }
    catalogueInfo.innerHTML = `${this.homecatalogue.nImages} photos, ${this.homecatalogue.nVideo} videos`;
  }
}

/**
 * @class Catalogue
 * Classe représentant un catalogue contenant des dossiers et des albums.
 */
class Catalogue {
  /**
   * @constructor
   * @param {Object} jsCatalogue - Données JSON représentant le catalogue.
   */
  constructor(jsCatalogue) {
    this.name = jsCatalogue.name;
    this.dateRange = jsCatalogue.dateRange;
    this.nVideo = jsCatalogue.nVideo;
    this.nImages = jsCatalogue.nImages;
    this.nAlbums = jsCatalogue.nAlbums;
    this.nFolder = jsCatalogue.nFolder;
    this.catalogue = [];
  }

  /**
   * @method addElement
   * Ajoute un élément au catalogue.
   * @param {Object} element - Les données JSON de l'élément à ajouter.
   */
  async addElement(element) {
    if (element) {
      if (element.type === "folder") {
        const folder = new Folder(element);
        this.catalogue.push(folder);
      } else if (element.type === "album") {
        const album = new Album(element);
        this.catalogue.push(album);
      }
    }
  }

  /**
   * @method initCatalogue
   * Initialise le catalogue en ajoutant les éléments depuis une source JSON.
   * @param {Array} catalogue - Tableau des éléments JSON à inclure.
   */
  async initCatalogue(catalogue) {
    for (const element of catalogue) {
      await this.addElement(element);
    }

    // Déclencher l'événement une fois terminé
    this.catalogue.sort((a, b) => a.index - b.index);
    const event = new Event("catalogueLoaded");
    document.dispatchEvent(event);
  }

  /**
   * @static
   * @method changeElementOrder
   * Modifie l'ordre d'un élément dans le catalogue.
   * @param {Object} item - L'élément à réordonner.
   * @param {boolean} orderUp - True pour monter, false pour descendre.
   */
  static async changeElementOrder(item, orderUp) {
    const url = "/update-home-sort"; // URL de l'API

    // Préparer les données à envoyer
    const requestData = {
      itemName: item.name, // Nom de l'élément à mettre à jour
      order_up: orderUp, // true pour monter, false pour descendre
    };

    try {
      // Envoyer la requête PATCH
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", // Type de contenu JSON
        },
        body: JSON.stringify({
          itemName: item.name, // Nom de l'élément à mettre à jour
          order_up: orderUp, // true pour monter, false pour descendre
        }), // Convertir les données en JSON
      });

      // Traiter la réponse
      if (response.ok) {
        Catalogue.moveElement(item.name, orderUp);

        console.log("hehe");
      } else {
        const errorData = await response.json();
        console.error("Erreur lors de la mise à jour:", errorData);
      }
    } catch (error) {
      console.error("Erreur réseau ou serveur:", error);
    }
  }

  /**
   * @static
   * @method moveElement
   * Déplace un élément du DOM vers le haut ou le bas.
   * @param {string} id - L'ID de l'élément à déplacer.
   * @param {number} direction - 0 pour déplacer vers le haut, 1 pour descendre.
   */
  static moveElement(id, direction) {
    // Récupérer l'élément par son ID
    const element = document.getElementById(id);
    const imageInfo = document.getElementById("image-info");

    if (!element) {
      console.error(`Aucun élément trouvé avec l'ID "${id}".`);
      return;
    }

    if (!imageInfo) {
      console.error(`Aucun élément trouvé avec l'ID "image-info".`);
      return;
    }

    // Récupérer le parent de l'élément
    const parent = element.parentElement;
    if (!parent) {
      console.error(`L'élément avec l'ID "${id}" n'a pas de parent.`);
      return;
    }

    // Calculer la position actuelle de "image-info" par rapport à l'élément
    const elementRect = element.getBoundingClientRect();
    const imageInfoRect = imageInfo.getBoundingClientRect();

    // Calculer le décalage entre "image-info" et l'élément déplacé
    const offsetTop = imageInfoRect.top - elementRect.top;
    const offsetLeft = imageInfoRect.left - elementRect.left;

    // Déterminer le nouvel emplacement dans le DOM
    if (direction === 0) {
      // Déplacer vers le haut
      const previousSibling = element.previousElementSibling;
      if (previousSibling) {
        parent.insertBefore(element, previousSibling);
      } else {
        console.warn(`Impossible de déplacer l'élément "${id}" plus haut.`);
      }
    } else if (direction === 1) {
      // Déplacer vers le bas
      const nextSibling = element.nextElementSibling;
      if (nextSibling) {
        parent.insertBefore(nextSibling, element);
      } else {
        console.warn(`Impossible de déplacer l'élément "${id}" plus bas.`);
      }
    } else {
      console.error(
        `Valeur de direction invalide : ${direction}. Utilisez 0 pour haut ou 1 pour bas.`
      );
      return;
    }

    // Recalculer la nouvelle position de l'élément après son déplacement
    const newElementRect = element.getBoundingClientRect();

    // Ajuster la position absolue de "image-info"
    imageInfo.style.position = "absolute";
    imageInfo.style.top = `${window.scrollY + newElementRect.top + offsetTop
      }px`;
    imageInfo.style.left = `${window.scrollX + newElementRect.left + offsetLeft
      }px`;

    // Faire défiler jusqu'à l'élément déplacé
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/**
 * @class Folder
 * Classe représentant un dossier contenant des albums.
 */
class Folder {
  /**
   * @constructor
   * Initialise un objet Folder avec les données JSON fournies.
   * @param {Object} jsFolder - Données JSON représentant un dossier.
   */
  constructor(jsFolder) {
    this.name = jsFolder.name;
    this.dateRange = jsFolder.dateRange;
    this.nVideo = jsFolder.nVideos;
    this.nImages = jsFolder.nImages;
    this.nAlbums = jsFolder.nAlbums;
    this.mainImagesURL = jsFolder.mainImagesURL.map((img) =>
      Album.setImageURL(img.URL, 10)
    );
    this.type = "folder";
    this.index = jsFolder.index;
  }

  /**
   * @method createThumbnail
   * Crée et ajoute une vignette de dossier à la galerie.
   */
  createThumbnail() {
    // Créer l'article
    const article = document.createElement("article");
    article.className = "thumbnail-folder";
    article.id = this.name;

    article.addEventListener("click", () => {
      const url = `/folder/${this.name}`; // Récupère l'URL stockée
      if (url) {
        window.location.href = url; // Redirige vers l'URL
      }
    });

    for (
      let index = 0;
      index < this.mainImagesURL.length && index < 3;
      index++
    ) {
      const src = this.mainImagesURL[index];

      const div = document.createElement("div");
      div.className = `thumbnail-folder-img-${index + 1}`;

      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      img.alt = "";

      div.appendChild(img);
      article.appendChild(div);
    }

    // Ajouter la description
    const descriptionDiv = document.createElement("div");
    descriptionDiv.className = "thumbnail-description";

    const name = document.createElement("p");
    name.className = "thumbnail-name";
    name.textContent = this.name;

    const date = document.createElement("p");
    date.className = "thumbnail-date"; // changer le nom de la calss
    date.textContent = this.nAlbums + " elements";

    descriptionDiv.appendChild(name);
    descriptionDiv.appendChild(date);
    article.appendChild(descriptionDiv);

    // Ajouter l'icône
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "shadow";

    article.appendChild(icon);

    // Ajouter l'article à la page
    PopupHandler.addPopupEvent(this, article);
    gallery.appendChild(article);
  }

  /**
   * @method getPopup
   * Retourne un élément HTML contenant les informations détaillées sur le dossier.
   * @returns {HTMLElement} Élément HTML représentant les informations du dossier.
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
        <p><strong>Album count: </strong><span id="image-info-date">${this.nAlbums}</span></p>
        <p><strong>Photo count: </strong><span id="image-info-date">${this.nImages}</span></p>
        <p><strong>Video count: </strong><span id="image-info-date">${this.nVideo}</span></p>
      </div>
    `;

    return infoDiv;
  }
}

/**
 * @class Album
 * Classe représentant un album contenant des images et des vidéos.
 */
class Album {
  /**
   * @constructor
   * Initialise un objet Album avec les données JSON fournies.
   * @param {Object} jsAlbum - Données JSON représentant un album.
   */
  constructor(jsAlbum) {
    this.name = jsAlbum.name;
    this.dateRange = jsAlbum.dateRange;
    this.nVideo = jsAlbum.nVideos;
    this.nImages = jsAlbum.nImages;
    this.mainImageURL = Album.setImageURL(jsAlbum.mainImageURL, 10);
    this.type = "album";
    this.index = jsAlbum.index;
  }

  /**
   * @method createThumbnail
   * Crée et ajoute une vignette d'album à la galerie.
   */
  createThumbnail() {
    const article = document.createElement("article");
    article.className = "thumbnail-album";
    article.id = this.name;

    article.addEventListener("click", () => {
      const url = `/album/${this.name}`; // Récupère l'URL stockée
      if (url) {
        window.location.href = url; // Redirige vers l'URL
      }
    });

    // Image principale
    const img = document.createElement("img");
    img.className = "thumbnail-album-img";
    img.src = this.mainImageURL;
    img.alt = "Thumbnail Image";
    img.loading = "lazy";
    article.appendChild(img);

    // Description
    const descriptionDiv = document.createElement("div");
    descriptionDiv.className = "thumbnail-description";

    const albumName = document.createElement("p");
    albumName.className = "thumbnail-name";
    albumName.textContent = this.name;

    const date = document.createElement("p");
    date.className = "thumbnail-date";
    date.textContent = `${this.nVideo + this.nImages} medias`;

    descriptionDiv.appendChild(albumName);
    descriptionDiv.appendChild(date);
    article.appendChild(descriptionDiv);

    // Ajouter l'article à la page
    PopupHandler.addPopupEvent(this, article);
    gallery.appendChild(article);
  }

  /**
   * @static
   * @method calculateQuality
   * Calcule la qualité d'image à utiliser en fonction de l'écran.
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
      return 50; // Qualité moyenne pour tablettes
    } else {
      return 75; // Qualité haute pour grands écrans
    }
  }

  /**
   * @static
   * @method setImageURL
   * Génère une URL d'image avec un paramètre de qualité ajusté.
   * @param {string} URL - L'URL de base de l'image.
   * @param {number} enhance - Amélioration supplémentaire de la qualité.
   * @returns {string} URL modifiée avec le paramètre de qualité.
   */  static setImageURL(URL, enhance = 0) {
    const quality = Album.calculateQuality();

    return `${URL}&quality=${quality + enhance}`;
  }

  /**
   * @method getPopup
   * Retourne un élément HTML contenant les informations détaillées sur l'album.
   * @returns {HTMLElement} Élément HTML représentant les informations de l'album.
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
 * Classe responsable de la gestion des popups affichant des informations détaillées sur un élément.
 */
class PopupHandler {
  /**
   * @static
   * @property {boolean} isPopupActive
   * Indique si une popup est actuellement active.
   */
  static isPopupActive = false; // Indique si une popup est active

  /**
   * @static
   * @method addPopupEvent
   * Ajoute un événement contextuel (clic droit) à un élément pour afficher une popup.
   * @param {Object} item - L'élément associé à la popup.
   * @param {HTMLElement} thumbnail - L'élément miniature qui déclenche la popup.
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
   * @method removeExistingInfoPopup
   * Supprime la popup d'informations existante, si elle est active.
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
   * @param {Object} item - L'élément pour lequel afficher la popup.
   * @param {number} posX - Position horizontale de la popup.
   * @param {number} posY - Position verticale de la popup.
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

    PopupHandler.addOrderButton(item, infoDiv);
    return infoDiv;
  }

  /**
   * @static
   * @method setupCloseOnClickOutside
   * Configure un événement pour fermer la popup lorsqu'un clic est effectué en dehors de celle-ci.
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

  /**
   * @static
   * @method addOrderButton
   * Ajoute des boutons de contrôle pour modifier l'ordre d'un élément dans la popup.
   * @param {Object} item - L'élément à réordonner.
   * @param {HTMLElement} infoDiv - La popup dans laquelle les boutons sont ajoutés.
   */
  static addOrderButton(item, infoDiv) {
    // Créer un élément <span> avec l'ID "order-selector"
    const orderSelectorElement = document.createElement("span");
    orderSelectorElement.id = "order-selector";

    // Créer le bouton avec la classe "order-button up-button"
    const upButton = document.createElement("button");
    upButton.className = "order-button up-button";
    const arrowUpIcon = document.createElement("div");
    arrowUpIcon.className = "arrow_up-icon";
    upButton.appendChild(arrowUpIcon);

    // Créer le <span> avec l'ID "order" pour afficher le numéro
    const orderSpan = document.createElement("span");
    orderSpan.id = "order";
    orderSpan.textContent = "1"; // Initialiser avec "1"

    // Créer le bouton avec la classe "order-button down-button"
    const downButton = document.createElement("button");
    downButton.className = "order-button down-button";
    const arrowDownIcon = document.createElement("div");
    arrowDownIcon.className = "arrow_down-icon";
    downButton.appendChild(arrowDownIcon);

    downButton.addEventListener("click", async () => {
      Catalogue.changeElementOrder(item, 1);
      console.log(item.name);
      console.log("down");
    });

    upButton.addEventListener("click", async () => {
      Catalogue.changeElementOrder(item, 0);
      console.log(item.name);
      console.log("up");
    });

    // Ajouter les éléments enfants dans l'élément principal <span>
    orderSelectorElement.appendChild(upButton);
    orderSelectorElement.appendChild(orderSpan);
    orderSelectorElement.appendChild(downButton);

    // Afficher l'élément dans la console pour vérifier
    console.log(orderSelectorElement);

    // Optionnel : Ajouter l'élément au DOM (par exemple, dans le <body>)
    infoDiv.appendChild(orderSelectorElement);
  }
}

async function handleSearchAction() {
  const searchInput = document.getElementById("search-input");
  const folderPath = searchInput.value;

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

  // Désélectionner le champ de saisie
  searchInput.blur();
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

// Empêche d'autres clics lorsque la popup est active, sauf sur ses éléments
document.addEventListener(
  "click",
  (e) => {
    if (PopupHandler.isPopupActive) {
      const popup = document.getElementById("image-info");

      // Vérifie si le clic est à l'extérieur de la popup
      if (popup && !popup.contains(e.target)) {
        e.stopPropagation();
        e.preventDefault();
        PopupHandler.removeExistingInfoPopup();
      }
    }
  },
  true // Utilise la phase de capture
);

window.addEventListener("pageshow", async () => {
  console.log("La page est entièrement chargée et le DOM est prêt.");
  try {
    const response = await fetch(`/get-Catalogue`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const rep = await response.json();
      gallery.innerHTML = "";

      const catalogue = new Catalogue(rep);
      await catalogue.initCatalogue(rep.catalogues);
      console.log(catalogue);

      const pageHandler = new PageHandler(catalogue);
      pageHandler.initPage();
    } else {
      const error = await response.json();
      alert(error.error || "Erreur lors du chargement des images.");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
  console.log("sessionStorage Update");
  sessionStorage.setItem("folder", "catalogue");
});
