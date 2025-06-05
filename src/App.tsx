import { useState } from "react";
import "./App.scss";
import { Logo } from "./components/Logo/Logo";
import { RichText } from "./components/RichText/RichText";
import { names } from "./config/names";

function App() {
    const [value, setValue] = useState<string>("");
    return (
        <div className="szRichText">
            <Logo />
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
        </div>
    );
}

export default App;
