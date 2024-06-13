import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import API from '../../api';
import {BoundingBox, Ship} from '../../api/types';
import {
  SHIP_ICON,
  MENU_ICON,
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  FIXED_LOCATIONS,
  INIT_ANIMATION_DURATION,
  INIT_ZOOM_LEVEL,
  UPDATE_INTERVAL,
  FAST_TRAVEL_ANIMATION_DURATION,
} from './constants';

import styles from './styles';
import InfoLabel from '../InfoLabel';

function MapView(): React.JSX.Element {
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(INIT_ZOOM_LEVEL);

  useEffect(() => {
    getViewPortBounds();
    updateInterval.current = setInterval(() => {
      updateShipData();
    }, UPDATE_INTERVAL);

    return () => {
      updateInterval.current && clearInterval(updateInterval.current);
      updateInterval.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateShipData() {
    // We skip updating ship data if zoom level is too low or too high
    const zoomLevel = (await mapRef?.current?.getZoom()) || INIT_ZOOM_LEVEL;
    setZoom(zoomLevel);
    if (zoomLevel < MIN_ZOOM_LEVEL || zoomLevel > MAX_ZOOM_LEVEL) {
      return;
    }

    if (isLoading) {
      return;
    }

    const visibleBounds = await getViewPortBounds();
    console.log(visibleBounds);

    if (!visibleBounds) {
      console.error('Error fetching viewport bounds');
      return;
    }

    setIsLoading(true);
    const shipData = await API.getShips(visibleBounds);
    console.log('Found ' + shipData.length + ' ships');
    setShips(shipData);
    setIsLoading(false);
  }

  async function getViewPortBounds(): Promise<BoundingBox | undefined> {
    const visibleBounds = await mapRef?.current?.getVisibleBounds();

    if (visibleBounds) {
      return visibleBounds as unknown as BoundingBox;
    }
    return undefined;
  }

  function showFixedLocatioMenu() {
    const locations = FIXED_LOCATIONS.map(location => ({
      text: location.title,
      onPress: () => {
        cameraRef?.current?.flyTo(
          location.position,
          FAST_TRAVEL_ANIMATION_DURATION,
        );
      },
    }));

    Alert.alert('Fast navigation', 'Select one of the preset locations', [
      ...locations,
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ]);
  }

  function renderShip(ship: Ship, id: number): React.JSX.Element {
    return (
      <MapLibreGL.MarkerView
        allowOverlap={false}
        key={`key-${id}`}
        id={`${id}`}
        coordinate={ship.position}>
        <View>
          <Text>{ship.name}</Text>
          <Image
            style={[
              styles.shipImage,
              {
                transform: [{rotate: `${ship.heading}deg`}],
              },
            ]}
            source={SHIP_ICON}
          />
        </View>
      </MapLibreGL.MarkerView>
    );
  }

  function renderShips(shipArray: Ship[]): React.JSX.Element[] {
    return shipArray.map((ship, i) => renderShip(ship, i));
  }

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        logoEnabled={false}
        styleURL="https://demotiles.maplibre.org/style.json">
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={INIT_ZOOM_LEVEL}
          animationMode="flyTo"
          animationDuration={INIT_ANIMATION_DURATION}
          centerCoordinate={FIXED_LOCATIONS[0].position}
        />
        {renderShips(ships)}
      </MapLibreGL.MapView>
      {isLoading && (
        <ActivityIndicator size={'large'} style={styles.loadingIndicator} />
      )}
      <InfoLabel>{`Zoom level: ${zoom.toFixed(1)}`}</InfoLabel>
      <Pressable
        style={styles.locationMenuButton}
        onPress={showFixedLocatioMenu}>
        <Image style={styles.locationMenuIcon} source={MENU_ICON} />
      </Pressable>
    </View>
  );
}

export default MapView;
