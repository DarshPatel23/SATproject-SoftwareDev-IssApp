// Home.js
// Main home screen for Beyond Meteor app.
// Simple, student-friendly comments added so a marker (or future you) can understand what's happening.

/* Imports */
import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    StatusBar,
    ImageBackground,
    Image
} from "react-native";

/*
  HomeScreen component:
  - Shows three big cards: ISS Location, Meteors, Lessons
  - Tapping a card navigates to the matching screen via this.props.navigation.navigate()
*/
export default class HomeScreen extends Component {
    constructor(props) {
        super(props);
        // state is empty for now, but kept for future use (e.g. user prefs)
        this.state = {

        };
    }

    render() {
        return (
            <View style={styles.container}>
                {/* Safe area to avoid status bar overlap on Android */}
                <SafeAreaView style={styles.droidSafeArea} />

                {/* Background image for the whole screen */}
                <ImageBackground source={require('../assets/bg.png')} style={styles.backgroundImage}>

                    {/* Title bar */}
                    <View style={styles.titleBar}>
                        <Text style={styles.titleText}>Beyond Meteor App</Text>
                    </View>

                    {/* ISS Location card */}
                    <TouchableOpacity
                      style={styles.routeCard}
                      onPress={() => this.props.navigation.navigate("IssLocation")}
                    >
                        {/* Main label */}
                        <Text style={styles.routeText}>ISS Location</Text>
                        {/* Small hint text */}
                        <Text style={styles.knowMore}>{"Know More --->"}</Text>
                        {/* Decorative large digit in background */}
                        <Text style={styles.bgDigit}>1</Text>
                        {/* Icon image for the card */}
                        <Image source={require("../assets/iss_icon.png")} style={styles.iconImage} />
                    </TouchableOpacity>

                    {/* Meteors card */}
                    <TouchableOpacity
                      style={styles.routeCard}
                      onPress={() => this.props.navigation.navigate("Meteors")}
                    >
                        <Text style={styles.routeText}>Meteors</Text>
                        <Text style={styles.knowMore}>{"Know More --->"}</Text>
                        <Text style={styles.bgDigit}>2</Text>
                        <Image source={require("../assets/meteor_icon.png")} style={styles.iconImage} />
                    </TouchableOpacity>

                    {/* Lessons card (placeholder content) */}
                    <TouchableOpacity
                      style={styles.routeCard}
                      onPress={() => this.props.navigation.navigate("Lessons")}
                    >
                      <Text style={styles.routeText}>Lessons</Text>
                      <Text style={styles.knowMore}>{"Know More --->"}</Text>
                      <Text style={styles.bgDigit}>3</Text>
                      <Image source={require("../assets/brain_img.png")} style={styles.iconImage} />
                    </TouchableOpacity>

                </ImageBackground>
            </View>
        );
    }
}

/* Styles:
   Simple layout using flex. Each style has a short note.
*/
const styles = StyleSheet.create({
    container: {
        flex: 1 // fill the whole screen
    },
    droidSafeArea: {
        // on Android, push content down by status bar height
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    backgroundImage: {
        flex: 1,
        resizeMode: 'cover', // cover the whole area
    },
    routeCard: {
        flex: 0.25, // how tall each card is relative to screen
        marginLeft: 50,
        marginRight: 50,
        marginTop: 50,
        borderRadius: 30,
        backgroundColor: 'white' // white card on top of background image
    },
    titleBar: {
        flex: 0.15,
        justifyContent: "center",
        alignItems: "center"
    },
    titleText: {
        fontSize: 40,
        fontWeight: "bold",
        color: "white"
    },
    routeText: {
        fontSize: 35,
        fontWeight: "bold",
        color: "black",
        marginTop: 75,
        paddingLeft: 30
    },
    knowMore: {
        paddingLeft: 30,
        color: "red",
        fontSize: 15
    },
    bgDigit: {
        position: "absolute",
        color: "rgba(183, 183, 183, 0.5)", // faded big number
        fontSize: 150,
        right: 20,
        bottom: -15,
        zIndex: -1 // push it behind the card content
    },
    iconImage: {
        position: "absolute",
        height: 200,
        width: 200,
        resizeMode: "contain",
        right: 20,
        top: -80 // moves the icon up so it overlaps the card (style choice)
    }
});