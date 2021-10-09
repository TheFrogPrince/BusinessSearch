/* Note: This example requires that you consent to location sharing when
 * prompted by your browser. If you see the error "Geolocation permission
 * denied.", it means you probably did not give permission for the browser * to locate you. */
var currPage;
var lastLocation;
var pos;
var map;
var bounds;
var infoWindow;
var currentInfoWindow;
var service;
var infoPane;
var currResults;
var iCurrResult;
var sContinueToken;
var oPagination;

var fMetersPerMile = 1609.344;



function loadGoogleScript() {
    var sAPIKey = document.getElementById("txtApiKey").value;
    var oScript = document.getElementById("scriptGoogle");
    oScript.remove();
    oScript = document.createElement("SCRIPT");
    oScript.id = "scriptGoogle";
    oScript.src = "https://maps.googleapis.com/maps/api/js?key=" + sAPIKey + "&libraries=places&callback=initMap";
    document.body.appendChild(oScript);
    document.getElementById("btnLoadMap").style.visibility = "hidden";
    document.getElementById("btnSearch").disabled = false;
    //alert(sAPIKey);
}


function initMap() {

    // Initialize variables
    bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow;
    currentInfoWindow = infoWindow;
    /* TODO: Step 4A3: Add a generic sidebar */
    infoPane = document.getElementById('panel');

    var longitude = document.getElementById("txtLongitude").value;
    var latitude = document.getElementById("txtLatitude").value;
    var zoom = document.getElementById("txtZoom").value;

    pos = { lat: Number.parseFloat(latitude), lng: Number.parseFloat(longitude) };
    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: Number.parseFloat(zoom)
    });

    //debugger;
    
}

// Handle a geolocation error
function search() {
    // Set default location to Sydney, Australia

    // Call Places Nearby Search on the default location
    getNearbyPlaces(map.getCenter());
}

// Perform a Places Nearby Search Request
function getNearbyPlaces(position) {
    currPage = 0;
    lastLocation = position;
    oPagination = null;
    var sSearchTerm = document.getElementById("txtSearchTerm").value;
    //var sRadius = document.getElementById("txtRadius").value;
    //var fRadius = Number.parseInt(sRadius) * fMetersPerMile;
    let request = {
        location: position,
        rankBy: google.maps.places.RankBy.DISTANCE,
        keyword: sSearchTerm,
        //radius: 49999
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, nearbyCallback);
}

function getMoreNearbyPlaces() {
    currPage = currPage + 1;
    if (currPage < 3) {
        if (oPagination != null) {
            if (oPagination.hasNextPage) {
                oPagination.nextPage();
            }
            else {
                alert("Search completed");
            }
        }
        else {
            alert("Search completed.");
        }
    }
}

function processResults() {
    iCurrResult++;
    if (iCurrResult > (currResults.length - 1)) {
        // Start next page
        getMoreNearbyPlaces();
    }
    else {
        var curr = currResults[iCurrResult];
        createMarker(curr);
        window.setTimeout(processResults, 500);

    }

}


// Handle the results (up to 20) of the Nearby Search
function nearbyCallback(results, status, pagination) {
    //debugger;
    console.log("Currpage = " + currPage + "  Result Count: " + results.length);
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // we have to set this up on a timer because of throttling limits
        oPagination = pagination;
        iCurrResult = -1;
        currResults = results;
        window.setTimeout(processResults, 500);
        //createMarkers(results);
        //if (currPage < 2) {
        //    getMoreNearbyPlaces();
        //}
    }
}

function createMarker(place) {
    if (place == null) {
        debugger;
    }
    let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name
    });

    /* TODO: Step 4B: Add click listeners to the markers */
    // Add click listener to each marker
    google.maps.event.addListener(marker, 'click', () => {
        let request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'formatted_phone_number',
                'website', 'photos', 'place_id']
        };

        /* Only fetch the details of a place when the user clicks on a marker.
         * If we fetch the details for all place results as soon as we get
         * the search response, we will hit API rate limits. */
        service.getDetails(request, (placeResult, status) => {
            showDetails(placeResult, marker, status)
        });
    });

    let request = {
        placeId: place.place_id,
        fields: ['name', 'formatted_address', 'formatted_phone_number',
            'website', 'photos', 'place_id']
    };

    service.getDetails(request, (placeResult, status) => {
        gridDetails(placeResult, marker, status)
    });

    // Adjust the map bounds to include the location of this marker
    bounds.extend(place.geometry.location);
    map.fitBounds(bounds);

}


function gridDetails(placeResult, marker, status) {
    var body = document.getElementById("bodyResult");
    var bFound = false;
    for (var i = 0; i < body.rows.length - 1; i++)
    {
        if (body.rows[i].cells[3].innerText == placeResult.place_id) {
            bFound = true;
            break;
        }
    }
    if (!bFound) {
        var row = document.createElement("TR");
        row.appendChild(createCell(placeResult.name));
        row.appendChild(createCell(placeResult.formatted_phone_number));
        row.appendChild(createCell(placeResult.formatted_address));
        row.appendChild(createCell(placeResult.place_id));
        document.getElementById("bodyResult").appendChild(row);
    }
}

function createCell(text) {
    var cell = document.createElement("TD");
    cell.innerText = text;
    return cell;
}


/* TODO: Step 4C: Show place details in an info window */
// Builds an InfoWindow to display details above the marker
function showDetails(placeResult, marker, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        let placeInfowindow = new google.maps.InfoWindow();
        let rating = "None";
        if (placeResult.rating) rating = placeResult.rating;
        placeInfowindow.setContent('<div><strong>' + placeResult.name +
            '</strong><br>' + 'Rating: ' + rating + '</div>');
        placeInfowindow.open(marker.map, marker);
        currentInfoWindow.close();
        currentInfoWindow = placeInfowindow;
        showPanel(placeResult);
    } else {
        console.log('showDetails failed: ' + status);
    }
}

/* TODO: Step 4D: Load place details in a sidebar */
// Displays place details in a sidebar
function showPanel(placeResult) {
    // If infoPane is already open, close it
    if (infoPane.classList.contains("open")) {
        infoPane.classList.remove("open");
    }

    // Clear the previous details
    while (infoPane.lastChild) {
        infoPane.removeChild(infoPane.lastChild);
    }

    /* TODO: Step 4E: Display a Place Photo with the Place Details */
    // Add the primary photo, if there is one
    if (placeResult.photos) {
        let firstPhoto = placeResult.photos[0];
        let photo = document.createElement('img');
        photo.classList.add('hero');
        photo.src = firstPhoto.getUrl();
        infoPane.appendChild(photo);
    }

    // Add place details with text formatting
    let name = document.createElement('h1');
    name.classList.add('place');
    name.textContent = placeResult.name;
    infoPane.appendChild(name);
    if (placeResult.rating) {
        let rating = document.createElement('p');
        rating.classList.add('details');
        rating.textContent = `Rating: ${placeResult.rating} \u272e`;
        infoPane.appendChild(rating);
    }
    let address = document.createElement('p');
    address.classList.add('details');
    address.textContent = placeResult.formatted_address;
    infoPane.appendChild(address);
    if (placeResult.website) {
        let websitePara = document.createElement('p');
        let websiteLink = document.createElement('a');
        let websiteUrl = document.createTextNode(placeResult.website);
        websiteLink.appendChild(websiteUrl);
        websiteLink.title = placeResult.website;
        websiteLink.href = placeResult.website;
        websitePara.appendChild(websiteLink);
        infoPane.appendChild(websitePara);
    }

    // Open the infoPane
    infoPane.classList.add("open");
}

