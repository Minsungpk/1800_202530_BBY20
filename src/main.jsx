// src/main.jsx
import {auth} from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContent = React.createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user);
    return unsubscribe;
}, [])

async function initiateUser(user) {
    if (user) {
      setCurrentUser(user);
      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }
    setLoading(false);
  } 

  const value = {
    currentUser,
    userLoggedIn,
    loading
  };

  return (
    <AuthContent.Provider value={value}>
      {!loading && children}
    </AuthContent.Provider>
  );
}