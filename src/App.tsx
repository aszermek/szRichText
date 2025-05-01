import { useState } from "react";
import { RichText } from "./components/RichText/RichText";
import { Logo } from "./components/Logo/Logo";
import "./App.scss";
import { Footer } from "./components/Footer/Footer";
import { names } from "./config/names";

function App() {
    const [value, setValue] = useState<string>("");
    return (
        <div className="szRichText">
            <main>
                <RichText
                    plugins={{
                        toolbar: {},
                        userMention: {
                            getUsers: async () =>
                                names.map((name) => ({
                                    id: 1,
                                    userName: name,
                                })),
                        },
                    }}
                    value={value}
                    onChange={setValue}
                />
            </main>
            <Footer />
        </div>
    );
}

export default App;
