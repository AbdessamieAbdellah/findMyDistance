import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';

import * as Location from 'expo-location';

const App = () => {
  const [markers, setMarkers] = useState([]);
  const [initialRegion, setInitialRegion] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [distance, setDistance] = useState(null);
  const [markerDetails, setMarkerDetails] = useState([]);

  useEffect(() => {
    getLocationAsync();
  }, []);

  const getLocationAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Please enable location services to use this app.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setInitialRegion({
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const handleMapPress = event => {
    const { coordinate } = event.nativeEvent;
    const newMarker = {
      id: markers.length + 1,
      coordinate: coordinate,
    };
    setMarkers([...markers, newMarker]);
  };

  const handleSelectMarker = id => {
    const marker = markers.find(marker => marker.id === id);
    if (selectedMarkers.length < 2 && !selectedMarkers.includes(marker)) {
      setSelectedMarkers([...selectedMarkers, marker]);
    } else {
      Alert.alert('Error', 'You can only select 2 markers.');
    }
  };

  const handleConfirm = async () => {
    if (selectedMarkers.length === 2) {
      const { coordinate: start } = selectedMarkers[0];
      const { coordinate: end } = selectedMarkers[1];
      const cityNameStart = await getCityName(start);
      const cityNameEnd = await getCityName(end);
      const dist = calculateDistance(start, end);
      setDistance(dist);
      Alert.alert(
        'Distance',
        `The distance between ${cityNameStart} and ${cityNameEnd} is ${dist} kilometers.`
      );
    } else {
      Alert.alert('Error', 'Please select 2 markers to confirm.');
    }
  };

  const calculateDistance = (start, end) => {
    const lat1 = start.latitude;
    const lon1 = start.longitude;
    const lat2 = end.latitude;
    const lon2 = end.longitude;

    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return (d / 1000).toFixed(2); // convert meters to kilometers
  };

  const getCityName = async coordinate => {
    const { latitude, longitude } = coordinate;
    try {
      const location = await Location.reverseGeocodeAsync({ latitude, longitude });
      return location && location[0] ? location[0].city || location[0].name || 'Unknown' : 'Unknown';
    } catch (error) {
      console.error('Error getting city name:', error);
      return 'Unknown';
    }
  };

  useEffect(() => {
    async function fetchMarkerDetails() {
      const details = await Promise.all(
        markers.map(marker => getCityName(marker.coordinate))
      );
      setMarkerDetails(details);
    }
    fetchMarkerDetails();
  }, [markers]);

  return (
    <View style={styles.container}>
      {initialRegion ? (
        <MapView
          style={styles.map}
          onPress={handleMapPress}
          initialRegion={initialRegion}
        >
          {markers.map((marker, index) => (
            <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={`Marker ${index + 1}`}
            onPress={() => handleSelectMarker(marker.id)}
          >
            <Callout>
              <View>
                <Text style={styles.calloutText}>
                  {markerDetails[index]}
                </Text>
              </View>
            </Callout>
          </Marker>
          
          ))}
          {selectedMarkers.length === 2 && (
            <Polyline
              coordinates={[
                selectedMarkers[0].coordinate,
                selectedMarkers[1].coordinate,
              ]}
              strokeWidth={2}
              strokeColor="blue"
            />
          )}
        </MapView>
      ) : (
<ActivityIndicator color={"green"} size={20} style={{flex:1}} />       )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {
          setMarkers([]);
          setSelectedMarkers([]);
          setDistance(null);
        }}>
          <Text style={styles.buttonText}>Clear All Markers</Text>
        </TouchableOpacity>
      </View>
      {distance && (
        <Text style={styles.distanceText}>
          Distance: {distance} kilometers
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  calloutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
