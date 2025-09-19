// App.js
// Main entry for the React Native app.
// Sets up navigation between the main screens: Home, ISS Location, Meteors, Lessons.
// Simple and clear so a teacher/marker can understand the flow.

import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import the screen components (each lives in ./screens/*)
import HomeScreen from "./screens/Home";
import IssLocationScreen from "./screens/IssLocation";
import MeteorScreen from "./screens/Meteors";
import LessonsScreen from "./screens/Lessons";

// Create a stack navigator (standard app navigation style)
const Stack = createStackNavigator();

function App() {
  // NavigationContainer wraps the whole app so navigation works
  // Stack.Navigator defines a stack of screens (one on top of another)
  return (
    <NavigationContainer>
      <Stack.Navigator
        // initialRouteName decides which screen opens first
        initialRouteName="Home"
        screenOptions={{
          // hide the default header to use a custom header or no header
          headerShown: false
        }}
      >
        {/* Each Stack.Screen registers a route name and the component to render */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="IssLocation" component={IssLocationScreen} />
        <Stack.Screen name="Meteors" component={MeteorScreen} />
        <Stack.Screen name="Lessons" component={LessonsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Export the App component so React Native can run it
export default App;
