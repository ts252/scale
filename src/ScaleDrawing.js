
import { useState, useRef, useEffect, Fragment } from "react";


export default function ScaleDrawing(props){
    const {fileData, scale, onLineCreated} = props    
    const [lineStart, setLineStart] = useState(null);
    const [lines, setLines] = useState([])
    const canvref = useRef();
    const i = useRef()    
    const [zoom, setZoom] = useState(1)
    const [naturalSize, setNaturalSize] = useState({x: 0, y: 0})
    const sizeHolder = useRef();
    const [pan, setPan] = useState({x: 0, y: 0})

    function snap(x, y, ctx){
        let pixel = ctx.getImageData(x-20, y-20, 40, 40);
        let data = pixel.data;
        
        let nearestSnapX, nearestSnapY, nearestSnapDist = 9999
        for(var snapy = 0; snapy < 40; snapy++){
          for(var snapx = 0; snapx < 40; snapx++){
            const off = (40 * snapy + snapx) * 4
            if(data[off + 3] != 0 && data[off] != 255){
              const dist = Math.sqrt(Math.pow(snapy - 20, 2) + Math.pow(snapx - 20, 2))
              if(dist < nearestSnapDist){
                nearestSnapDist = dist
                nearestSnapX = snapx
                nearestSnapY = snapy
              }
            }
          }
        }
    
        if(nearestSnapX !== undefined){      
          return {
            x: nearestSnapX - 20 + x,
            y: nearestSnapY - 20 + y
          }
        } else {
          return null;
        }
      }
    
      function drawAll(ctx, x, y, snapped, ctrl){
        ctx.clearRect(0, 0, 6000, 4000)
        const im = i.current;
        const canvas = canvref.current
        ctx.drawImage(im, pan.x, pan.y, canvas.width / zoom, canvas.height / zoom, 0, 0, canvas.width, canvas.height)
          
        ctx.strokeStyle = "red"
        ctx.fillStyle = "red"
        ctx.font = "14px Arial"
        ctx.lineWidth = 1
        ctx.setLineDash([])
        
        if(snapped){      
          ctx.beginPath()      
          ctx.moveTo(snapped.x - 20, snapped.y - 20)
          ctx.lineTo(snapped.x + 20, snapped.y + 20)
          ctx.moveTo(snapped.x - 20, snapped.y + 20)
          ctx.lineTo(snapped.x + 20, snapped.y - 20)      
          ctx.stroke()            
        } 
    
        function dimension(ctx, x, y, num){
          const text = (num / zoom).toFixed(1)
          ctx.save()      
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.strokeStyle = "white"
          ctx.lineWidth = 3
          ctx.strokeText(text, x, y)
          ctx.fillText(text, x, y)
          ctx.restore()
        }
    
        function drawLine(ctx, start, end){
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)      
          ctx.stroke() 
          dimension(ctx, (start.x + end.x)/2, (start.y + end.y) / 2, Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)) * scale)
        }
    
        ctx.strokeStyle = "cyan"
        for(let l of lines){
          drawLine(ctx, imageToScreen(l.start), imageToScreen(l.end))
        }    
        ctx.strokeStyle = "red"
    
        if(lineStart){
          const dest = snapped || {x, y}
    
          ctx.beginPath()      
          ctx.arc(lineStart.x, lineStart.y, 10, 0, 360)      
          ctx.stroke() 
    
          if(ctrl){
            if(Math.abs(lineStart.x - dest.x) < Math.abs(lineStart.y - dest.y)){
              drawLine(ctx, lineStart, {x: lineStart.x, y: dest.y})          
            } else {
              drawLine(ctx, lineStart, {x: dest.x, y: lineStart.y})
            }
          } else {
            drawLine(ctx, lineStart, dest)
          }         
        }
      }
      
    
      function mouseMove(event){
        if(!canvref.current){
          return
        }
        const ctx = canvref.current.getContext("2d")
        var x = event.nativeEvent.offsetX;
        var y = event.nativeEvent.offsetY;
    
        const snapped = snap(x, y, ctx)  
    
        drawAll(ctx, x, y, snapped, event.ctrlKey)      
      }
    
      function screenToImage({x, y}){
        return {x: (x / zoom + pan.x), y: (y / zoom + pan.y)}
      }
    
      function imageToScreen({x, y}){
        return {x: (x - pan.x) * zoom, y: (y - pan.y) * zoom}
      }
    
      function mouseDown(event){
        const ctx = canvref.current.getContext("2d")
        var x = event.nativeEvent.offsetX;
        var y = event.nativeEvent.offsetY;
    
        const snapped = snap(x, y, ctx)
    
        if(lineStart){
          let end = snapped || {x, y}
          if(event.ctrlKey){
            if(Math.abs(lineStart.x - end.x) < Math.abs(lineStart.y - end.y)){
              end.x = lineStart.x
            } else {
              end.y = lineStart.y
            }
          }
          const newLine = {start: screenToImage(lineStart), end: screenToImage(end)}
          setLines(lines.concat([newLine]))
          onLineCreated(newLine)
          setLineStart(null)      
        } else {
          setLineStart(snapped || {x, y})
        }    
    
        drawAll(ctx, x, y, snapped, event.ctrlKey)
      }
    
      function scroll(event){
        setPan({x: event.target.scrollLeft, y: event.target.scrollTop})         
      }
    
      useEffect(() => {
        const canvas = canvref.current
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    
        function mouseWheel(event){
          if(event.ctrlKey){        
            const newZoom = zoom * (event.deltaY < 0 ? 1.1 : 0.9) 
            const x = event.offsetX;
            const y = event.offsetY;      
            const newPan = {
              x: Math.min(naturalSize.x * Math.min(zoom, newZoom), Math.max(0, Math.round((x / zoom) - (x / newZoom) + pan.x))), 
              y: Math.min(naturalSize.y * Math.min(zoom, newZoom), Math.max(0, Math.round((y / zoom) - (y / newZoom) + pan.y)))
            }        
            setPan(newPan)        
            sizeHolder.current.scrollLeft = newPan.x
            sizeHolder.current.scrollTop = newPan.y
            event.preventDefault()
            event.stopPropagation()                  
            setZoom(newZoom)
          }
        }
    
        window.addEventListener("wheel", mouseWheel, {passive: false})
    
        return () => {
          window.removeEventListener("wheel", mouseWheel)
        }
        
      }, [zoom, pan.x, pan.y, naturalSize.x, naturalSize.y])
    
      useEffect(() => {
        const ctx = canvref.current.getContext("2d")   
        drawAll(ctx)
      })

      useEffect(() => {
          if(fileData){
              i.current.onload = () => {                
                setNaturalSize({x: i.current.naturalWidth, y: i.current.naturalHeight})            
            }     
            i.current.src = fileData
        }
      }, [fileData])

    /*
     reader.result */


     return (
        <Fragment><img ref={i} alt="thumbnail"/>
        <canvas ref={canvref} />     
        <div ref={sizeHolder} id="sizeHolder" onMouseMove={mouseMove} onClick={mouseDown} onScroll={scroll}>
        <div style={{width: naturalSize.x * zoom, height: naturalSize.y * zoom}} />
        </div>
        </Fragment>
     )
} 