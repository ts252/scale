import { useState, useRef, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import ScaleDrawing from "./ScaleDrawing";

import './App.css';

const fileTypes = ["JPG", "PNG", "SVG"];

function Scale(props){
  const {lastLine, scale, onSetScale} = props
  
  const realdim = useRef()

  if(!lastLine){
    return "Measure a known distance to set the scale"
  }

  const length = Math.sqrt(Math.pow(lastLine.start.x - lastLine.end.x, 2) + Math.pow(lastLine.start.y - lastLine.end.y, 2))

  return (
    <div>
      {length.toFixed(1)} px = <input type="number" min="0" ref={realdim} placeholder="1000"></input> <input id="unit" placeholder="mm"></input>
      <button onClick={() => {
        onSetScale(realdim.current.value / length)
      }}>Set scale</button>
      <div>Scale is {scale.toFixed(1)} mm/px</div>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null)
  const [scale, setScale] = useState(1)
  const [lastLine, setLastLine] = useState(null)
  
  const handleChange = (file) => {
    setFile(file);
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = function() {
      setFileData(reader.result)
      /* clever but not needed
      const [prefix, b64] = reader.result.split(",", 2)
      let svgsrc = atob(b64)
      let doc = (new DOMParser()).parseFromString(svgsrc, "text/xml")
      let w = Number.parseInt(doc.querySelector("svg").getAttribute("width"))
      let h = Number.parseInt(doc.querySelector("svg").getAttribute("height"))
      if(w < 1000){
        //doc.querySelector("svg").setAttribute("width", "1000mm")
        //doc.querySelector("svg").setAttribute("height", Math.round(1000 / w * h) + "mm")
      }
      svgsrc = (new XMLSerializer().serializeToString(doc))
      const dataurl = prefix + "," + btoa(svgsrc)
*/
     
    }
  }

  

  return (  
    <div className="App">
      <div className="overlay"><FileUploader handleChange={handleChange} name="file" types={fileTypes} />
      <p>{file ? `${file.name}` : "no files uploaded yet"} </p>
      <Scale lastLine={lastLine} scale={scale} onSetScale={setScale} />
      </div>
      <ScaleDrawing fileData={fileData} scale={scale} onLineCreated={(line) => {setLastLine(line)}}/>

     </div>
      
  );
}

