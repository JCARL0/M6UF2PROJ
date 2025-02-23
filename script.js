// Cargar comunidades autonomas
function cargarComunidades() {
    const url = "https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/ccaa.json";
    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectCCAA = document.getElementById("ccaa");
            selectCCAA.innerHTML = '<option value="" disabled selected>Selecciona una opcion</option>';
            for (let i = 0; i < datos.length; i++) {
                const ccaa = datos[i];
                const option = document.createElement("option");
                option.innerText = ccaa.label;
                option.value = ccaa.code;
                selectCCAA.appendChild(option);
            }
        });
}

// Cargar provincias segun la comunidad seleccionada
function cargarProvincias() {
    const selectCCAA = document.getElementById("ccaa");
    const ccaaCode = selectCCAA.value;
    const url = "https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/provincias.json";
    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectProvincia = document.getElementById("provincia");
            selectProvincia.innerHTML = '<option value="" disabled selected>Selecciona una opcion</option>';
            for (let i = 0; i < datos.length; i++) {
                const provincia = datos[i];
                if (provincia.parent_code === ccaaCode) {
                    const option = document.createElement("option");
                    option.innerText = provincia.label;
                    option.value = provincia.code;
                    selectProvincia.appendChild(option);
                }
            }
        });
}

// Cargar poblaciones segun la provincia seleccionada
function cargarPoblaciones() {
    const selectProvincia = document.getElementById("provincia");
    const provinciaCode = selectProvincia.value;
    const url = "https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/poblaciones.json";
    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectPoblacion = document.getElementById("poblacion");
            selectPoblacion.innerHTML = '<option value="" disabled selected>Selecciona una opcion</option>';
            for (let i = 0; i < datos.length; i++) {
                const poblacion = datos[i];
                if (poblacion.parent_code === provinciaCode) {
                    const option = document.createElement("option");
                    option.innerText = poblacion.label;
                    option.value = poblacion.code;
                    selectPoblacion.appendChild(option);
                }
            }
        });
}

// Mostrar imagenes de la poblacion seleccionada
function mostrarImagenes(event) {
    event.preventDefault();
    const selectPoblacion = document.getElementById("poblacion");
    const poblacionSeleccionada = selectPoblacion.options[selectPoblacion.selectedIndex].innerText;

    // Mostrar coordenadas de la poblacion seleccionada
    mostrarCoordenadas(poblacionSeleccionada);

    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=images&titles=${encodeURIComponent(poblacionSeleccionada)}&gimlimit=10&prop=imageinfo&iiprop=url`;
    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => {
            const imageContainer = document.getElementById("image-container");
            imageContainer.innerHTML = "";
            if (datos.query) {
                const pages = datos.query.pages;
                for (const pageId in pages) {
                    const imagen = pages[pageId].imageinfo[0].url;

                    const container = document.createElement("div");
                    container.className = "image-container";

                    const imgDiv = document.createElement("div");
                    imgDiv.className = "image-box";

                    const imgElement = document.createElement("img");
                    imgElement.src = imagen;
                    imgElement.alt = "Imagen de " + poblacionSeleccionada;
                    imgDiv.appendChild(imgElement);


                    const saveButton = document.createElement("button");
                    saveButton.innerText = "Guardar";
                    saveButton.className = "save-button";
                    saveButton.onclick = () => guardarImagen(imagen);

                    container.appendChild(imgDiv);
                    container.appendChild(saveButton);

                    imageContainer.appendChild(container);
                }
            } else {
                imageContainer.innerHTML = "<p>No se encontraron imagenes para esta poblacion</p>";
            }
        });
}

// Guardar imagen en localStorage
function guardarImagen(imagenUrl) {
    let savedImages = JSON.parse(localStorage.getItem("savedImages")) || [];
    if (!savedImages.includes(imagenUrl)) {
        savedImages.push(imagenUrl);
        localStorage.setItem("savedImages", JSON.stringify(savedImages));
        mostrarImagenesGuardadas();
    }
}

// Mostrar imagenes guardadas
function mostrarImagenesGuardadas() {
    const savedImages = JSON.parse(localStorage.getItem("savedImages")) || [];
    const savedImagesContainer = document.getElementById("saved-images");
    savedImagesContainer.innerHTML = "";

    savedImages.forEach(imagenUrl => {
        const imgDiv = document.createElement("div");
        imgDiv.className = "image-box";

        const imgElement = document.createElement("img");
        imgElement.src = imagenUrl;
        imgElement.alt = "Imagen guardada";

        imgDiv.appendChild(imgElement);
        savedImagesContainer.appendChild(imgDiv);
    });
}

// Mostrar coordenadas de la poblacion seleccionada y calcular distancia
function mostrarCoordenadas(poblacionSeleccionada) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(poblacionSeleccionada)}&limit=1`;
    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => {
            if (datos.length > 0) {
                const lat = datos[0].lat;
                const lon = datos[0].lon;
                const coordenadasContainer = document.getElementById("coordenadas");

                // Obtener la ubicacion actual
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((posicion) => {
                        const latUsuario = posicion.coords.latitude;
                        const lonUsuario = posicion.coords.longitude;

                        const distancia = calcularDistanciaHaversine(latUsuario, lonUsuario, lat, lon);
                        coordenadasContainer.innerHTML = `Latitud: ${lat}<br>Longitud: ${lon}<br>Distancia: ${distancia.toFixed(2)} km`;
                    });
                }
            }
        });
}

// Funcion para calcular la distancia usando la formula de Haversine
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const radioTierra = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = radioTierra * c;
    return distancia;
}

cargarComunidades();
mostrarImagenesGuardadas();
document.getElementById("ccaa").addEventListener("change", cargarProvincias);
document.getElementById("provincia").addEventListener("change", cargarPoblaciones);
document.getElementById("submit").addEventListener("click", mostrarImagenes);