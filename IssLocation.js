// IssLocation.js
// ISS location screen for Beyond Meteor (works on web and native).
// Comments are simple and student-friendly so a marker or future-you can follow the logic.

/* Imports */
import React, { Component, createRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  Image,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

/* 
  react-native-maps is large and only works on native (Android/iOS).
  For web we use a lightweight approach: a Leaflet map inside an <iframe>.
  The code below loads Maps only when Platform.OS !== 'web'.
*/
let MapView, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default class IssLocationScreen extends Component {
  constructor(props) {
    super(props);
    // state.location will hold the API data for the ISS
    this.state = { location: {} };
    // keep the interval id so we can clear it later
    this.intervalId = null;
    // ref for the web iframe (used to postMessage new coords)
    this.webFrameRef = createRef();
  }

  componentDidMount() {
    // fetch once immediately when the screen loads
    this.getIssLocation();
    // then refresh periodically (every 3 seconds here)
    // NOTE: in a real app you might use a longer interval to avoid rate limits
    this.intervalId = setInterval(this.getIssLocation, 3000);
  }

  componentWillUnmount() {
    // always clear intervals when component is removed to avoid memory leaks
    if (this.intervalId) clearInterval(this.intervalId);
  }

  componentDidUpdate(prevProps, prevState) {
    // For web builds: when our state.location changes, post message to iframe
    // so the inner Leaflet map can move the marker without reloading the whole iframe.
    if (
      Platform.OS === 'web' &&
      prevState.location !== this.state.location &&
      this.webFrameRef.current &&
      this.webFrameRef.current.contentWindow
    ) {
      const { latitude, longitude } = this.state.location;
      // simple message object — the iframe code listens for this and updates the marker
      this.webFrameRef.current.contentWindow.postMessage(
        { lat: latitude, lng: longitude },
        '*'
      );
    }
  }

  // Fetch the ISS location from the public whereTheISS.at API
  getIssLocation = () => {
    axios
      .get('https://api.wheretheiss.at/v1/satellites/25544')
      .then((response) => this.setState({ location: response.data }))
      .catch((error) => {
        // show a simple alert for now — good enough for a school project
        Alert.alert('Error getting ISS location', error.message);
        console.log('ISS API error:', error);
      });
  };

  // Web map renderer: creates a small HTML page with Leaflet and an event listener
  // that updates the circleMarker when postMessage is received.
  renderMapWeb = () => {
    const { latitude, longitude } = this.state.location;

    // srcDoc HTML for the iframe (simple Leaflet map)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
          <style>
            html, body { height: 100%; margin: 0; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            // initial map and marker setup
            var map = L.map('map').setView([${latitude}, ${longitude}], 3);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            var marker = L.circleMarker([${latitude}, ${longitude}], {
              radius: 8, color: '#d00', fillColor: '#f33', fillOpacity: 0.9, weight: 2
            }).addTo(map);

            // listen for postMessage from React app
            window.addEventListener('message', function(e) {
              if (!e || !e.data || typeof e.data.lat !== 'number') return;
              var latlng = [e.data.lat, e.data.lng];
              marker.setLatLng(latlng);
              map.panTo(latlng, { animate: true });
            });
          </script>
        </body>
      </html>
    `;

    // Return iframe with the map HTML
    return (
      <View style={styles.webMapWrapper}>
        <iframe
          ref={this.webFrameRef}
          title="ISS Map"
          srcDoc={html}
          style={styles.webIframe}
          // sandbox reduces security risks; allow-scripts and allow-same-origin are needed for this example
          sandbox="allow-scripts allow-same-origin"
        />
      </View>
    );
  };

  render() {
    const isLoading = Object.keys(this.state.location).length === 0;

    // show a basic Loading view while no data present
    if (isLoading) {
      return (
        <View style={styles.loadingWrap}>
          <Text>Loading</Text>
        </View>
      );
    }

    // main view: background image, exit button, map (web/native) and info box
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.droidSafeArea} />

        {/* Exit button to return to home quickly (added after beta feedback) */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => this.props.navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.exitText}>⟵ Exit</Text>
        </TouchableOpacity>

        <ImageBackground
          source={require('../assets/bg.png')}
          style={styles.backgroundImage}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>ISS Location</Text>
          </View>

          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              // show the iframe map on web
              this.renderMapWeb()
            ) : (
              // show react-native-maps on native devices
              <MapView
                style={styles.map}
                region={{
                  latitude: this.state.location.latitude,
                  longitude: this.state.location.longitude,
                  // these deltas are large so the map shows a wide area — tweak later if needed
                  latitudeDelta: 100,
                  longitudeDelta: 100,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: this.state.location.latitude,
                    longitude: this.state.location.longitude,
                  }}
                >
                  <Image
                    source={require('../assets/iss_icon.png')}
                    style={{ height: 50, width: 50 }}
                  />
                </Marker>
              </MapView>
            )}
          </View>

          {/* Small info box at bottom showing numbers */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Latitude: {this.state.location.latitude}
            </Text>
            <Text style={styles.infoText}>
              Longitude: {this.state.location.longitude}
            </Text>
            <Text style={styles.infoText}>
              Altitude (KM): {this.state.location.altitude}
            </Text>
            <Text style={styles.infoText}>
              Velocity (KM/H): {this.state.location.velocity}
            </Text>
          </View>
        </ImageBackground>
      </View>
    );
  }
}

/* Simple styles */
const styles = StyleSheet.create({
  container: { flex: 1 },
  droidSafeArea: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backgroundImage: { flex: 1, resizeMode: 'cover' },
  titleContainer: { flex: 0.1, justifyContent: 'center', alignItems: 'center' },
  titleText: { fontSize: 30, fontWeight: 'bold', color: 'white' },
  mapContainer: { flex: 0.7 },
  map: { width: '100%', height: '100%' },
  infoContainer: {
    flex: 0.2,
    backgroundColor: 'white',
    marginTop: -10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  infoText: { fontSize: 15, color: 'black', fontWeight: 'bold' },

  // Web map wrapper + iframe styles
  webMapWrapper: { flex: 1, width: '100%', height: '100%' },
  webIframe: { border: 0, width: '100%', height: '100%' },

  // Loading
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Exit button
  exitButton: {
    position: "absolute",
    top: (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0) + 10,
    left: 14,
    zIndex: 999,
    backgroundColor: "rgba(255,255,255,1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exitText: { color: "black", fontSize: 16, fontWeight: "bold" },
});

