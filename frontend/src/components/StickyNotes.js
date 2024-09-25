import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Draggable from 'react-draggable';
import './StickyNotes.css';
import { debounce } from 'lodash';
import { FaTrash, FaEdit, FaPalette, FaExpand, FaCompress, FaFont } from 'react-icons/fa';

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
}

function getContrastColor(color) {
    return isLightColor(color) ? '#000000' : '#FFFFFF';
}

function StickyNotes() {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const { isLoggedIn } = useAuth();
    const [noteColor, setNoteColor] = useState('#ffeb3b');
    const [textColor, setTextColor] = useState('#000000');
    const [contrastColor, setContrastColor] = useState(getContrastColor(noteColor));
    const notesAreaRef = useRef(null);
    const [noteHeights, setNoteHeights] = useState({});

    useEffect(() => {
        fetchNotes();
    }, [isLoggedIn]);

    useEffect(() => {
        return () => {
            // Only save positions that have changed
            notes.forEach(note => {
                if (note.position_x !== note.originalX || note.position_y !== note.originalY) {
                    updatePosition(note.id, { x: note.position_x, y: note.position_y });
                }
            });
        };
    }, []);

    useEffect(() => {
        setContrastColor(getContrastColor(noteColor));
    }, [noteColor]);

    const fetchNotes = () => {
        if (isLoggedIn) {
            axios.get('http://localhost:8000/api/sticky-notes/')
                .then(response => {
                    const fetchedNotes = response.data.map(note => ({
                        ...note,
                        originalX: note.position_x,
                        originalY: note.position_y,
                        contrastColor: getContrastColor(note.color),
                        height: note.height || 125 // Ensure height is set
                    }));
                    setNotes(fetchedNotes);
                    const heights = {};
                    fetchedNotes.forEach(note => {
                        heights[note.id] = note.height;
                    });
                    setNoteHeights(heights);
                })
                .catch(error => {
                    console.error('Error fetching notes:', error);
                });
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            setNotes(localNotes.map(note => ({
                ...note,
                originalX: note.position_x,
                originalY: note.position_y,
                contrastColor: getContrastColor(note.color)
            })));
            const heights = {};
            localNotes.forEach(note => {
                heights[note.id] = note.height;
            });
            setNoteHeights(heights);
        }
    };

    const addNote = async () => {
        const contrastColor = getContrastColor(noteColor);
        const newNoteData = {
            content: newNote,
            color: noteColor,
            text_color: textColor,
            position_x: 0,
            position_y: 0,
            is_expanded: false,
            contrast_color: contrastColor,
            created_at: new Date().toISOString(),
            height: 125
        };
    
        if (isLoggedIn) {
            try {
                const response = await axios.post('http://localhost:8000/api/sticky-notes/', newNoteData);
                setNotes([...notes, { ...response.data, contrastColor }]);
            } catch (error) {
                console.error('Error adding note:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const newNote = { ...newNoteData, id: Date.now() }; // Use timestamp as ID for local notes
            localNotes.push(newNote);
            localStorage.setItem('stickyNotes', JSON.stringify(localNotes));
            setNotes([...notes, { ...newNote, contrastColor }]);
        }
        setNewNote('');
    };

    const updateNote = async (id, updates) => {
        if (isLoggedIn) {
            try {
                const response = await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, updates);
                setNotes(notes.map(note => note.id === id ? { ...response.data, contrastColor: getContrastColor(response.data.color) } : note));
                if (updates.height) {
                    setNoteHeights(prev => ({ ...prev, [id]: updates.height }));
                }
            } catch (error) {
                console.error('Error updating note:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, ...updates, contrastColor: getContrastColor(updates.color || note.color) } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
            setNotes(updatedNotes);
        }
    };

    const deleteNote = async (id) => {
        if (isLoggedIn) {
            try {
                await axios.delete(`http://localhost:8000/api/sticky-notes/${id}/`);
                setNotesAndSave(notes.filter(note => note.id !== id));
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.filter(note => note.id !== id).map(note => ({
                ...note,
                contrastColor: getContrastColor(note.color)
            }));
            setNotesAndSave(updatedNotes);
        }
    };

    const setNotesAndSave = (newNotes) => {
        const processedNotes = newNotes.map(note => ({
            ...note,
            contrastColor: getContrastColor(note.color)
        }));
        setNotes(processedNotes);
        if (!isLoggedIn) {
            localStorage.setItem('stickyNotes', JSON.stringify(processedNotes));
        }
    };

    const debouncedUpdatePosition = debounce((id, data) => {
        updatePosition(id, data);
    }, 300, { leading: true, trailing: false });

    const updatePosition = async (id, data) => {
        if (isLoggedIn) {
            try {
                await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, {
                    position_x: data.x,
                    position_y: data.y
                });
            } catch (error) {
                console.error('Error updating note position:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, position_x: data.x, position_y: data.y } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
        }
        setNotes(prevNotes => prevNotes.map(note =>
            note.id === id ? { ...note, position_x: data.x, position_y: data.y } : note
        ));
    };

    const editNote = async (id, newContent) => {
        setNotes(prevNotes => prevNotes.map(note =>
            note.id === id ? { ...note, content: newContent } : note
        ));
        debouncedUpdateNote(id, { content: newContent });
    };

    const debouncedUpdateNote = debounce(async (id, updates) => {
        if (isLoggedIn) {
            try {
                await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, updates);
            } catch (error) {
                console.error('Error updating note:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, ...updates } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
        }
    }, 500);

    const changeColor = async (id) => {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        const contrastColor = getContrastColor(randomColor);
        
        if (isLoggedIn) {
            try {
                const response = await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, {
                    color: randomColor,
                    contrast_color: contrastColor
                });
                setNotes(prevNotes => prevNotes.map(note =>
                    note.id === id ? { ...response.data, contrastColor } : note
                ));
            } catch (error) {
                console.error('Error changing note color:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, color: randomColor, contrast_color: contrastColor } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
            setNotes(prevNotes => prevNotes.map(note =>
                note.id === id ? { ...note, color: randomColor, contrastColor } : note
            ));
        }
    };

    const changeTextColor = async (id) => {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        
        if (isLoggedIn) {
            try {
                const response = await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, { text_color: randomColor });
                setNotes(prevNotes => prevNotes.map(note =>
                    note.id === id ? { ...note, text_color: randomColor } : note
                ));
            } catch (error) {
                console.error('Error changing text color:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, text_color: randomColor } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
            setNotes(prevNotes => prevNotes.map(note =>
                note.id === id ? { ...note, text_color: randomColor } : note
            ));
        }
    };

    const toggleExpand = async (id) => {
        const updatedNote = notes.find(note => note.id === id);
        const newExpandedState = !updatedNote.is_expanded;
        
        if (isLoggedIn) {
            try {
                const response = await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, { is_expanded: newExpandedState });
                setNotes(prevNotes => prevNotes.map(note =>
                    note.id === id ? { ...note, is_expanded: newExpandedState } : note
                ));
            } catch (error) {
                console.error('Error toggling expand:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, is_expanded: newExpandedState } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
            setNotes(prevNotes => prevNotes.map(note =>
                note.id === id ? { ...note, is_expanded: newExpandedState } : note
            ));
        }
    };

    const handleHeightChange = (id, height) => {
        setNoteHeights(prev => ({ ...prev, [id]: height }));
        setNotes(prevNotes => prevNotes.map(note =>
            note.id === id ? { ...note, height } : note
        ));
        debouncedUpdateNoteHeight(id, height);
    };

    const debouncedUpdateNoteHeight = debounce(async (id, height) => {
        if (isLoggedIn) {
            try {
                await axios.patch(`http://localhost:8000/api/sticky-notes/${id}/`, { height });
            } catch (error) {
                console.error('Error updating note height:', error);
            }
        } else {
            const localNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const updatedNotes = localNotes.map(note => 
                note.id === id ? { ...note, height } : note
            );
            localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
        }
    }, 500);

    return (
        <div className="sticky-notes-container">
            <div className="note-input">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                />
                <div className="color-picker">
                    <span>Note Color: </span>
                    <input
                        type="color"
                        value={noteColor}
                        onChange={(e) => setNoteColor(e.target.value)}
                        title="Choose note color"
                    />
                </div>
                <div className="color-picker">
                    <span>Text Color: </span>
                    <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        title="Choose text color"
                    />
                </div>
                <button onClick={addNote}>Add Note</button>
            </div>
            <p>* To save the height note you need to click the note text area.</p>

            <div className="notes-area" ref={notesAreaRef}>
                {notes.map(note => (
                    <Draggable
                        key={note.id}
                        defaultPosition={{ x: note.position_x, y: note.position_y }}
                        onStop={(e, data) => debouncedUpdatePosition(note.id, data)}
                        bounds="parent"
                        handle=".note-handle"
                    >
                        <div
                            className={`note ${note.is_expanded ? 'expanded' : ''}`}
                            style={{ backgroundColor: note.color }}
                        >
                            <div className="note-handle" style={{ color: note.contrastColor }}>
                                <span>Drag here</span>
                                <div className="note-actions">
                                    <button onClick={() => changeColor(note.id)}><FaPalette /></button>
                                    <button onClick={() => changeTextColor(note.id)}><FaFont /></button>
                                    <button onClick={() => toggleExpand(note.id)}>
                                        {note.is_expanded ? <FaCompress /> : <FaExpand />}
                                    </button>
                                    <button onClick={() => deleteNote(note.id)}><FaTrash /></button>
                                </div>
                            </div>
                            <textarea
                                value={note.content}
                                onChange={(e) => editNote(note.id, e.target.value)}
                                style={{ 
                                    color: note.text_color, 
                                    height: `${noteHeights[note.id] || 125}px` 
                                }}
                                onMouseUp={(e) => handleHeightChange(note.id, e.target.offsetHeight)}
                            />
                            <div className="note-footer">
                                <small style={{ color: note.contrastColor }}>
                                    {note.created_at ? formatDate(note.created_at) : 'Date unavailable'}
                                </small>
                            </div>
                        </div>
                    </Draggable>
                ))}
            </div>
        </div>
    );
}

export default StickyNotes;