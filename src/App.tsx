import { useLayoutEffect, useState } from 'react';
import { fromEvent, switchMap, takeUntil, timer } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Map, Marker } from "pigeon-maps"

import './App.css';
export interface IssPosition {
  latitude: string;
  longitude: string;
}
export interface IssResponse {
  timestamp: number;
  message: string;
  iss_position: IssPosition;
}
function App() {
  const [state, setState] = useState<null | AjaxResponse<IssResponse>>(null)
  const [restart, setRestart] = useState(false)
  const [center, setCenter] = useState<[number, number]>([50.879, 4.6997])



  useLayoutEffect(() => {
    const stopPolling$ = fromEvent(document.getElementById('stop-polling')!, 'click')
    const $data = timer(0, 1000)
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
      next: value => setState(value),
      error: err => console.log(err)
    });
    return () => subscription.unsubscribe()
  }, [restart])


  return (
    <div className="App">
      <Map height={400} center={center} defaultZoom={5}

        onBoundsChanged={({ center, zoom, bounds }) => {
          console.log(bounds)
          setCenter([Number(state?.response.iss_position.latitude), Number(state?.response.iss_position.longitude)])
        }} >
        <Marker

          width={50} anchor={[Number(state?.response.iss_position.latitude), Number(state?.response.iss_position.longitude)]} />
      </Map>
      <pre>lat: {state?.response.iss_position.latitude}</pre>
      <pre>lon: {state?.response.iss_position.longitude}</pre>
      <button id="stop-polling">stop</button>
      <button onClick={() => setRestart(!restart)}>restart</button>
    </div>
  );
}

export default App;
