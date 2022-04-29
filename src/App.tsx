import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fromEvent, switchMap, takeUntil, timer } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Map, Marker } from "pigeon-maps"

import './App.css';
import { kMaxLength } from 'buffer';
export interface IssPosition {
  latitude: string;
  longitude: string;
}
export interface IssResponse {
  timestamp: number;
  message: string;
  iss_position: IssPosition;
}
export const issCoordinatesInitialState = {
  longitude: "0",
  latitude: "0"
}

function App() {
  const [issCoordinates, setIssCoordinates] = useState<IssPosition>(issCoordinatesInitialState)
  const [restart, setRestart] = useState(false)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  // const [neBound, setNeBound] = useState<[number, number]>()
  // const [swBound, setSWBound] = useState<[number, number]>()
  const mapRef = useRef<Map>(null)

  useLayoutEffect(() => {
    async function fetchCenter() {
      fetch('http://api.open-notify.org/iss-now.json')
        .then(response => response.json())
        .then((data: IssResponse) => {
          setCenter([Number(data.iss_position.latitude),
          Number(data.iss_position.longitude)])
          setIssCoordinates({
            latitude: data.iss_position.latitude,
            longitude: data.iss_position.longitude
          })
        });
    }
    fetchCenter()

    const stopPolling$ = fromEvent(document.getElementById('stop-polling')!, 'click')
    const $data = timer(0, 1250)
      .pipe(
        switchMap(() => ajax<IssResponse>({
          url: "http://api.open-notify.org/iss-now.json",
          method: 'GET',
          crossDomain: true,
          createXHR: function () {
            return new XMLHttpRequest();
          }
        })),
        takeUntil(stopPolling$)
      );
    const subscription = $data.subscribe({
      next: value => setIssCoordinates(value.response.iss_position),
      error: err => console.log(err)
    });

    return () => subscription.unsubscribe()
  }, [restart])

  useEffect(() => {
    // const [centerLat, centerLon] = center
    const { latitude, longitude } = issCoordinates;
    if (mapRef.current) {
      console.log(Math.abs(mapRef.current.getBounds().ne[0]), Math.abs(Number(latitude)))
    }
    // console.log("lat diff", Number(latitude))
    // console.log("lon diff", centerLon - Number(longitude))
  }, [issCoordinates])

  return (
    <div className="App">
      <Map height={700} center={center} defaultZoom={5}
        ref={mapRef}
        onBoundsChanged={({ center, zoom, bounds }) => {
          console.log(bounds)
          setCenter([Number(issCoordinates?.latitude), Number(issCoordinates?.longitude)])

        }} >
        <Marker
          width={80}
          anchor={[Number(issCoordinates?.latitude), Number(issCoordinates?.longitude)]} />

      </Map>


      <p>lat: {issCoordinates?.latitude}</p>
      <p>lon: {issCoordinates?.longitude}</p>
      <div>
        <h2>bounds</h2>
        {/* <p>ne: {JSON.stringify(neBound)}</p>
        <p>sw: {JSON.stringify(swBound)}</p> */}
      </div>
      <button id="stop-polling">stop</button>
      <button onClick={() => setRestart(!restart)}>restart</button>
    </div>
  );
}

export default App;