import { useState, useEffect } from "react";
import "./App.css";
import cassette from "./assets/cassette.png";
import cassetteSpin from "./assets/cassette-spin.mp4";
import memoriesBg from "./assets/memories-bg.mp4";

// Firebase
import { auth, db, storage } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedMemory, setExpandedMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  const [memories, setMemories] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [acceptedQuests, setAcceptedQuests] = useState([]);
  const [quests, setQuests] = useState([]);

  const [showMemories, setShowMemories] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionMedia, setReflectionMedia] = useState(null);
  const [showToDo, setShowToDo] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showCassette, setShowCassette] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [newQuest, setNewQuest] = useState("");
  const [currentQuest, setCurrentQuest] = useState("");
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // Single Auth Listener + Fetch User Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setQuests([]);
        setAcceptedQuests([]);
        setCompletedQuests([]);
        setMemories([]);
        return;
      }

      setUser(currentUser);

      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setQuests(data.quests || []);
        setAcceptedQuests(data.acceptedQuests || []);
        setCompletedQuests(data.completedQuests || []);
        setMemories(data.memories || []);
      } else {
        await setDoc(userRef, {
          quests: [],
          acceptedQuests: [],
          completedQuests: [],
          memories: [],
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowCassette(false);
  };

  const handleMemories = () => setShowMemories(true);

  const generateQuest = (skipSpin = false) => {
    if (quests.length === 0) {
      alert("No quests added yet!");
      return;
    }
    if (!skipSpin) {
      setSpinning(true);
      setTimeout(() => {
        pickRandomQuest();
        setSpinning(false);
      }, 3000);
    } else {
      pickRandomQuest();
    }
  };

  const pickRandomQuest = () => {
    const randomIndex = Math.floor(Math.random() * quests.length);
    setCurrentQuest(quests[randomIndex]);
    setShowQuestModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // LOGIN PAGE
  if (showLogin) {
    return (
      <div className="App">
        <button
          className="back-button"
          onClick={() => setShowLogin(false)}
          style={{ position: "absolute", top: "20px", left: "20px" }}
        >
          ← back
        </button>

        <div className="note">
          <p style={{ color: "#8e8c8bff" }}>Log in</p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />

          {loginError && <p style={{ color: "red", fontSize: "0.9rem" }}>{loginError}</p>}

          <button
            onClick={async () => {
              if (!username || !password) {
                setLoginError("Please fill in all fields");
                return;
              }
              try {
                if (isSignup) {
                  await createUserWithEmailAndPassword(auth, username, password);
                } else {
                  await signInWithEmailAndPassword(auth, username, password);
                }
                setLoginError("");
                setShowLogin(false);
                setShowCassette(true);
              } catch (err) {
                setLoginError(err.message);
              }
            }}
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>

          <p
            style={{ fontSize: "1rem", cursor: "pointer", opacity: 0.8, color: "#f9f1f1ff" }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Already have an account? Login" : "New here? Sign up"}
          </p>
        </div>
      </div>
    );
  }

  // CASSETTE PAGE
  if (showCassette) {
    return (
      <div className="cassette-page">
        <button className="back-button" onClick={() => setShowCassette(false)}>
          ← back
        </button>

        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <button className="top-right-button" onClick={handleMemories}>
            Memories
          </button>
          <button className="top-right-button" onClick={() => setShowToDo(true)}>
            To Do
          </button>
          <button className="top-right-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {spinning ? (
          <video
            src={cassetteSpin}
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noplaybackrate"
            className="cassette-video"
            style={{ maxWidth: "85vw", maxHeight: "85vh", objectFit: "contain" }}
          />
        ) : (
          <img
            src={cassette}
            alt="Cassette"
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }}
          />
        )}

        <div className="cassette-buttons">
          <button onClick={() => generateQuest(false)}>Give me a quest</button>
          <button onClick={() => setShowAddQuest(true)}>Add a quest</button>
        </div>

        {/* Quest Modal */}
        {showQuestModal && (
          <div className="add-quest-modal">
            <div className="add-quest-box quest-pop">
              <button className="close-button" onClick={() => setShowQuestModal(false)}>
                ✕
              </button>
              <p
                style={{
                  fontSize: "1.2rem",
                  color: "#000000ff",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {currentQuest}
              </p>
              <div className="modal-buttons" style={{ justifyContent: "center", gap: "12px" }}>
                <button
                  style={{ backgroundColor: "#101010ff", color: "white" }}
                  onClick={async () => {
                    const updatedAccepted = [...acceptedQuests, currentQuest];
                    const updatedQuests = quests.filter((q) => q !== currentQuest);

                    setAcceptedQuests(updatedAccepted);
                    setQuests(updatedQuests);
                    setShowQuestModal(false);

                    if (user) {
                      const userRef = doc(db, "users", user.uid);
                      await updateDoc(userRef, {
                        quests: updatedQuests,
                        acceptedQuests: updatedAccepted,
                      });
                    }
                  }}
                >
                  Accept
                </button>

                <button
                  style={{ backgroundColor: "#030303ff", color: "white" }}
                  onClick={() => generateQuest(true)}
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* To Do Modal */}
        {showToDo && (
          <div className="add-quest-modal">
            <div className="add-quest-box">
              <h3 style={{ textAlign: "center" }}>To Do Quests</h3>
              {acceptedQuests.length === 0 ? (
                <p style={{ textAlign: "center", color: "#070707ff" }}>No quests accepted yet.</p>
              ) : (
                <ul>
                  {acceptedQuests.map((quest, i) => (
                    <li
                      key={i}
                      style={{ marginBottom: "6px", cursor: "pointer" }}
                      onClick={() => {
                        setSelectedQuest(quest);
                        setShowCompleteModal(true);
                      }}
                    >
                      {quest}
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ textAlign: "center" }}>
                <button onClick={() => setShowToDo(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Quest Modal */}
        {showCompleteModal && (
          <div className="add-quest-modal">
            <div className="add-quest-box todo-box">
              <h3>Complete Quest</h3>
              <p style={{ color: "#000" }}>{selectedQuest}</p>
              <textarea
                placeholder="Write your reflection..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
              />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setReflectionMedia(Array.from(e.target.files))}
              />
              <div className="modal-buttons">
                <button
                  onClick={async () => {
                    if (!user) return;

                    // Upload media
                    let mediaUrls = [];
                    if (reflectionMedia && reflectionMedia.length > 0) {
                      for (let file of reflectionMedia) {
                        const storageRef = ref(
                          storage,
                          `users/${user.uid}/memories/${Date.now()}_${file.name}`
                        );
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);
                        mediaUrls.push({ url, type: file.type });
                      }
                    }

                    // Completed quest object
                    const completedQuest = {
                      quest: selectedQuest,
                      reflection: reflectionText,
                      media: mediaUrls,
                      completedAt: new Date(),
                    };

                    const updatedCompleted = [...completedQuests, completedQuest];
                    const updatedAccepted = acceptedQuests.filter((q) => q !== selectedQuest);
                    const updatedMemories = [...memories, completedQuest];

                    setCompletedQuests(updatedCompleted);
                    setAcceptedQuests(updatedAccepted);
                    setMemories(updatedMemories);

                    setReflectionText("");
                    setReflectionMedia(null);
                    setSelectedQuest(null);
                    setShowCompleteModal(false);
                    setShowToDo(false);

                    // Firestore update
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                      acceptedQuests: updatedAccepted,
                      completedQuests: updatedCompleted,
                      memories: updatedMemories,
                    });
                  }}
                >
                  Complete
                </button>

                <button onClick={() => setShowCompleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Quest Modal */}
        {showAddQuest && (
          <div className="add-quest-modal">
            <div className="add-quest-box">
              <textarea
                placeholder="Type your quest..."
                value={newQuest}
                onChange={(e) => setNewQuest(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  onClick={async () => {
                    if (newQuest.trim() === "" || !user) return;

                    const updatedQuests = [...quests, newQuest];
                    setQuests(updatedQuests);

                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                      quests: updatedQuests,
                    });

                    setNewQuest("");
                    setShowAddQuest(false);
                  }}
                >
                  Save
                </button>

                <button onClick={() => setShowAddQuest(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Memories Modal */}
        {showMemories && (
          <div className="add-quest-modal" style={{ position: "fixed" }}>
            <video
              src={memoriesBg}
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              controls={false}
              onCanPlay={() => setVideoReady(true)}
              style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                objectFit: "cover",
                zIndex: 0,
                opacity: videoReady ? 1 : 0,
                transition: "opacity 0.8s ease",
              }}
            />

            <div
              className="add-quest-box"
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255,255,255,0.85)",
                maxHeight: "80vh",
                overflowY: "auto",
                opacity: videoReady ? 1 : 0,
                transform: videoReady ? "translateY(0)" : "translateY(12px)",
                transition: "all 0.6s ease",
              }}
            >
              <h3 style={{ textAlign: "center" }}>Memories</h3>

              {memories.length === 0 ? (
                <p style={{ textAlign: "center", color: "#070707ff" }}>No memories yet.</p>
              ) : (
                <div className="memories-list">
                  {memories.map((mem, i) => (
                    <div
                      key={i}
                      className="memory-item"
                      onClick={() => setExpandedMemory(expandedMemory === i ? null : i)}
                      style={{
                        cursor: "pointer",
                        marginBottom: "14px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#f0f0f0",
                        position: "relative",
                      }}
                    >
                      <p style={{ fontSize: "0.85rem", opacity: 0.6, color: "#090909ff" }}>
                        {mem.completedAt ? formatDate(mem.completedAt) : "Completed"}
                      </p>
                      <p style={{ fontWeight: "bold", color: "#070707ff" }}>{mem.quest}</p>

                      {expandedMemory === i && (
                        <div style={{ marginTop: "8px", position: "relative" }}>
                          {/* Edit icon */}
                          <button
                            style={{
                              position: "absolute",
                              top: -65,
                              right: -5,
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1rem",
                              padding: "4px",
                              color: "#040404ff",
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (editingMemory === i) {
                                // Save edits to Firestore
                                setEditingMemory(null);
                                if (user) {
                                  const userRef = doc(db, "users", user.uid);
                                  await updateDoc(userRef, { memories });
                                }
                              } else {
                                setEditingMemory(i);
                              }
                            }}
                          >
                            {editingMemory === i ? "Done" : "✎"}
                          </button>

                          {editingMemory === i ? (
                            <>
                              {/* Edit reflection */}
                              <textarea
                                value={mem.reflection || ""}
                                onChange={(e) => {
                                  const updatedMemories = [...memories];
                                  updatedMemories[i].reflection = e.target.value;
                                  setMemories(updatedMemories);
                                }}
                                style={{ width: "100%", borderRadius: "8px" }}
                              />

                              {/* Existing media with delete */}
                              {mem.media?.map((file, j) => (
                                <div key={j} style={{ marginTop: "6px", position: "relative" }}>
                                  {file.url ? (
                                    file.type.startsWith("image") ? (
                                      <img
                                        src={file.url}
                                        alt=""
                                        style={{ width: "100%", borderRadius: "8px" }}
                                      />
                                    ) : (
                                      <video
                                        src={file.url}
                                        controls
                                        style={{ width: "100%", borderRadius: "8px" }}
                                      />
                                    )
                                  ) : file.type.startsWith("image") ? (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt=""
                                      style={{ width: "100%", borderRadius: "8px" }}
                                    />
                                  ) : (
                                    <video
                                      src={URL.createObjectURL(file)}
                                      controls
                                      style={{ width: "100%", borderRadius: "8px" }}
                                    />
                                  )}

                                  <button
                                    style={{
                                      position: "absolute",
                                      top: 2,
                                      right: 2,
                                      background: "#f0f0f0",
                                      color: "black",
                                      border: "black 1px solid",
                                      cursor: "pointer",
                                      fontSize: "0.8rem",
                                      padding: "3px",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updatedMemories = [...memories];
                                      updatedMemories[i].media.splice(j, 1);
                                      setMemories(updatedMemories);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}

                              {/* Add new media */}
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  if (!e.target.files || e.target.files.length === 0) return;
                                  const updatedMemories = [...memories];
                                  updatedMemories[i].media = [
                                    ...(updatedMemories[i].media || []),
                                    ...Array.from(e.target.files),
                                  ];
                                  setMemories(updatedMemories);
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {/* VIEW MODE */}
                              {mem.reflection && <p style={{ color: "#040404ff" }}>{mem.reflection}</p>}
                              {mem.media?.map((file, j) => (
                                <div key={j} style={{ marginTop: "6px" }}>
                                  {file.url ? (
                                    file.type.startsWith("image") ? (
                                      <img
                                        src={file.url}
                                        alt=""
                                        style={{ width: "100%", borderRadius: "8px" }}
                                      />
                                    ) : (
                                      <video
                                        src={file.url}
                                        controls
                                        style={{ width: "100%", borderRadius: "8px" }}
                                      />
                                    )
                                  ) : file.type.startsWith("image") ? (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt=""
                                      style={{ width: "100%", borderRadius: "8px" }}
                                    />
                                  ) : (
                                    <video
                                      src={URL.createObjectURL(file)}
                                      controls
                                      style={{ width: "100%", borderRadius: "8px" }}
                                    />
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button onClick={() => setShowMemories(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Welcome Page
  return (
    <div className="App">
      <div className="note">
        <p>Ready for a side quest?</p>
        <button onClick={() => setShowLogin(true)}>Enter</button>
      </div>
    </div>
  );
}

export default App;
