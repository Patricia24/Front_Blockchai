import React from "react";
import { render } from "react-dom";

import FileUpload from "./FileUpload";

const App = () => (
  <div>
    <FileUpload
      onReadSuccess={(
        ipfsObjects: { path: string, hash: string, size: number }[]
      ) => {
        ipfsObjects.forEach(ipfsObject => {
          const hashs=ipfsObject.hash;
          const URL = `https://ipfs.io/ipfs/${ipfsObject.hash}`;
          console.log("Esta es la  URL",URL);
          console.log("Esta es la  URL",hashs);
        });
      }}
      onReadFailure={console.error}
    />
  </div>
);

render(<App />, document.getElementById("root"));
