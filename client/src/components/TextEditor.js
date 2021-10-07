import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {io} from 'socket.io-client'; 

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ]

const TextEditor = () => {
    const {id : documentID} = useParams();
    const [socket , setSocket] = useState();
    const [quill , setQuill] = useState();

    useEffect(()=>{
        const s = io('https://google-docs3212.herokuapp.com');

        setSocket(s);

        return ()=> s.disconnect();
    },[]);

    useEffect(()=>{
        if(socket == null || quill == null) return;

        socket.once('load-document',document=>{
            quill.setContents(document);
            quill.enable();
        })

        socket.emit('get-document',documentID);
    },[socket,quill,documentID]);

    useEffect(()=>{
        if(socket == null || quill == null) return;
        const interval = setInterval(() => {
            socket.emit('save-document',quill.getContents());
        }, SAVE_INTERVAL_MS);


        return ()=>{
            clearInterval(interval);
        }
    },[socket,quill])

    const wrapperRef = useCallback((wrapper)=>{
        if(wrapper == null) return;

        wrapper.innerHTML = '';

        const editor = document.createElement('div');
        wrapper.append(editor);
        const q = new Quill(editor,{
            theme : 'snow',
            modules : {toolbar : TOOLBAR_OPTIONS}
        });

        q.disable();
        q.setText('Loading...');

        setQuill(q);
    },[]);

    useEffect(()=>{

        if(quill == null || socket == null) return;

        const handler = (delta,oldDelta,source)=>{
            if(source !== 'user') return;
            socket.emit("send-changes",delta);
        }

        quill.on('text-change',handler);

        return ()=>{
            quill.off('text-change',handler);
        }
    },[quill,socket]);


    useEffect(()=>{

        if(quill == null || socket == null) return;

        const handler = (delta)=>{
            quill.updateContents(delta);
        }

        socket.on('receive-changes',handler);

        return ()=>{
            socket.off('receive-changes',handler);
        }
    },[quill,socket]);

    return ( 
        <div className="container" ref={wrapperRef}>
        </div>
     );
}
 
export default TextEditor;