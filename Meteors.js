// Meteors.js
// Meteor screen for Beyond Meteor app
// Shows a small carousel of near-Earth objects fetched from NASA NeoWs.
// Comments are simple and short so a teacher/marker and a Year 11/12 student can follow.

// IMPORTS
import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";

// screen size helpers
const { width, height } = Dimensions.get("window");

// background images used for cards (replace or re-upload if assets expired)
const BG_IMAGES = [
  require("../assets/meteor_bg1.png"),
  require("../assets/meteor_bg2.png"),
  require("../assets/meteor_bg3.png"),
];

export default class MeteorScreen extends Component {
  // simple local state for meteors and UI
  state = {
    meteors: [],     // list of meteor objects (from NASA)
    index: 0,        // which card is showing
    loading: true,   // show Loading while fetching
    animating: false,// flag for slide animation
    nextIndex: null, // index of next card during animation
  };

  // animated values for slide effect
  currX = new Animated.Value(0);
  nextX = new Animated.Value(width);

  componentDidMount() {
    // fetch data when the screen is shown
    this.getMeteors();
  }

  // Main API call to NASA NeoWs "feed" endpoint (example key used here)
  // Note: do not hardcode API keys for real apps — store keys securely.
  getMeteors = async () => {
    try {
      const res = await axios.get(
        // WARNING: this example has a key in code. For real projects use env/config files.
        "https://api.nasa.gov/neo/rest/v1/feed?api_key=nAkq24DJ2dHxzqXyzfdreTvczCVOnwJuFLFq4bDZ"
      );

      // The API returns an object grouped by date: near_earth_objects: { "2025-xx-xx": [..], ... }
      const obj = res.data.near_earth_objects || {};
      const byDay = Object.keys(obj).map((d) => obj[d]);

      // flatten all days into one array of meteors
      let meteors = [].concat.apply([], byDay);

      // Add a simple 'threat_score' computed from diameter / miss distance:
      // - diameter is average of min/max estimated diameters
      // - miss is the closest approach miss distance in km (fallback to 1 to avoid div by zero)
      // threat_score = (diameter / miss) * 1_000_000_000 (scaled for easier comparison)
      meteors.forEach((m) => {
        const minD = m.estimated_diameter.kilometers.estimated_diameter_min;
        const maxD = m.estimated_diameter.kilometers.estimated_diameter_max;
        const diameter = (Number(minD) + Number(maxD)) / 2;
        // guard: use a fallback of 1 if miss_distance not available
        const miss = Number(m.close_approach_data?.[0]?.miss_distance?.kilometers || 1);
        m.threat_score = (diameter / miss) * 1_000_000_000;
      });

      // Sort meteors by closest miss distance (closest first)
      meteors.sort((a, b) => {
        const am = Number(a.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity);
        const bm = Number(b.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity);
        return am - bm;
      });

      // Keep only top 5 for the prototype to keep UI simple and fast
      this.setState({ meteors: meteors.slice(0, 5), loading: false });
    } catch (e) {
      // show a simple alert if fetch fails, and stop loading
      Alert.alert("Error", e.message);
      this.setState({ loading: false });
      console.log("Meteor fetch error:", e);
    }
  };

  // Small helper to choose visuals (background, animated gif, size) depending on threat score
  visualsFor = (meteor, idx) => {
    const bg_img = BG_IMAGES[idx % BG_IMAGES.length];
    // small animated gif showing "speed" or meteor visual
    const speed = require("../assets/meteor_speed3.gif");
    // pick a size for the visual based on threat_score (simple mapping)
    const size = meteor.threat_score <= 30 ? 100 : meteor.threat_score <= 75 ? 150 : 200;
    return { bg_img, speed, size };
  };

  // Sliding animation: dir is -1 for left, +1 for right, nextIndex is the target card index
  startSlide = (dir, nextIndex) => {
    if (this.state.animating) return; // don't start a new animation while one is running
    this.setState({ animating: true, nextIndex }, () => {
      // set initial positions for the current and next animated views
      this.nextX.setValue(dir * width); // next card starts off-screen
      this.currX.setValue(0);           // current card starts in place

      // run two animations in parallel
      Animated.parallel([
        Animated.timing(this.currX, { toValue: -dir * width, duration: 220, useNativeDriver: true }),
        Animated.timing(this.nextX, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        // when animation finishes, update index and reset flags/positions
        this.setState({ index: nextIndex, animating: false, nextIndex: null }, () => {
          this.currX.setValue(0);
          this.nextX.setValue(width);
        });
      });
    });
  };

  // helpers for arrow controls
  prev = () => {
    const { index } = this.state;
    if (index === 0) return; // already first
    this.startSlide(-1, index - 1);
  };
  next = () => {
    const { index, meteors } = this.state;
    if (index === meteors.length - 1) return; // already last
    this.startSlide(1, index + 1);
  };

  // Card component: shows a single meteor card (image + info)
  Card = ({ meteor, idx, animatedX }) => {
    const { bg_img, speed, size } = this.visualsFor(meteor, idx);
    const approach = meteor.close_approach_data?.[0] || {};
    const dia = meteor.estimated_diameter?.kilometers || {};

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: animatedX }] }}>
        <ImageBackground source={bg_img} style={styles.backgroundImage}>

          {/* Exit button (quick navigation back to Home) */}
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => this.props.navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.exitText}>⟵ Exit</Text>
          </TouchableOpacity>

          {/* Visual area with the animated meteor GIF */}
          <View style={styles.visualArea}>
            <Image source={speed} style={{ width: size, height: size }} />
          </View>

          {/* Info panel (scrollable in case of long text) */}
          <View style={styles.infoPanel}>
            <ScrollView
              style={{ maxHeight: height * 0.3 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <Text style={styles.cardTitle}>{meteor.name}</Text>
              <Text style={styles.cardText}>
                Closest to Earth – {approach.close_approach_date_full}
              </Text>
              <Text style={styles.cardText}>
                Minimum Diameter (KM) – {dia.estimated_diameter_min}
              </Text>
              <Text style={styles.cardText}>
                Maximum Diameter (KM) – {dia.estimated_diameter_max}
              </Text>
              <Text style={styles.cardText}>
                Velocity (KM/H) – {approach.relative_velocity?.kilometers_per_hour}
              </Text>
              <Text style={styles.cardText}>
                Missing Earth by (KM) – {approach.miss_distance?.kilometers}
              </Text>
            </ScrollView>
          </View>
        </ImageBackground>
      </Animated.View>
    );
  };

  render() {
    const { meteors, index, loading, animating, nextIndex } = this.state;

    // Loading state
    if (loading) {
      return (
        <View style={styles.center}>
          <Text>Loading</Text>
        </View>
      );
    }

    // No data state
    if (!meteors.length) {
      return (
        <View style={styles.center}>
          <Text>No meteor data</Text>
        </View>
      );
    }

    // main render: show current card and optionally the next animating card
    const current = meteors[index];
    const nextM = nextIndex != null ? meteors[nextIndex] : null;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.droidSafeArea} />

        {/* Stacked cards area */}
        <View style={{ flex: 1 }}>
          <this.Card meteor={current} idx={index} animatedX={this.currX} />
          {animating && nextM ? (
            <View style={StyleSheet.absoluteFill}>
              <this.Card meteor={nextM} idx={nextIndex} animatedX={this.nextX} />
            </View>
          ) : null}
        </View>

        {/* Left / Right arrow buttons for navigation */}
        <TouchableOpacity
          onPress={this.prev}
          disabled={index === 0 || animating}
          style={[styles.arrow, styles.leftArrow, (index === 0 || animating) && styles.arrowDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={this.next}
          disabled={index === meteors.length - 1 || animating}
          style={[styles.arrow, styles.rightArrow, (index === meteors.length - 1 || animating) && styles.arrowDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>

        {/* Small dots to show which card is active */}
        <View style={styles.dotsRow}>
          {meteors.map((_, i) => (
            <View key={i} style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      </View>
    );
  }
}

// Styles kept simple and clear
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  droidSafeArea: { marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  backgroundImage: { flex: 1, resizeMode: "cover", width, height },

  visualArea: { flex: 0.7, alignItems: "center", justifyContent: "center" },

  infoPanel: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  cardTitle: { fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 8 },
  cardText: { color: "white", marginBottom: 6 },

  // Exit
  exitButton: {
    position: 'absolute',
    top: (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) + 10,
    left: 14,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Arrows
  arrow: {
    position: "absolute",
    top: height * 0.45,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  arrowText: { color: "white", fontSize: 30, lineHeight: 30, fontWeight: "700" },
  leftArrow: { left: 12 },
  rightArrow: { right: 12 },
  arrowDisabled: { opacity: 0.35 },

  // Dots
  dotsRow: {
    position: "absolute", bottom: 18, width: "100%",
    flexDirection: "row", justifyContent: "center",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: "white" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.45)" },

  // Loading
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" },
});
