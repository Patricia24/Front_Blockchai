import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import IPFS from 'ipfs';
import { Buffer } from 'buffer';
import streamBuffers from 'stream-buffers';

const ProgressBar = styled.div`
  width: ${props => ((props.progress || 0) / props.total * 130).toFixed(1)}px;
  height: 20px;
  background-color: #66ccff;
  position: absolute;
  left: 9px;
  top: 10px;
`

export default class FileUploadInput extends Component {
  static propTypes = {
    readAs: PropTypes.oneOf(['readAsDataURL', 'readAsArrayBuffer', 'readAsBinaryString', 'readAsText']),
    onReadSuccess: PropTypes.func.isRequired,
    onReadFailure: PropTypes.func.isRequired,
    allowMultiple: PropTypes.bool,
    validateFiles: PropTypes.func,
    initialText: PropTypes.string,
    inputProps: PropTypes.object,
    fileInputProps: PropTypes.object,
  };

  static defaultProps = {
    readAs: 'readAsArrayBuffer',
    allowMultiple: false,
    validateFiles: files => null,
    initialText: '',
    inputProps: {},
    fileInputProps: {},
  };

  node:any;
  stream: any;

  state = {
    progress: 0,
    totalFileSize: 0,
  };

  constructor(props) {
    super(props);
    this.state = { text: props.initialText, files: [] };

   
    const repoPath = 'ipfs-' + Math.random();
    this.node = new IPFS({ repo: repoPath });

    this.node.on('ready', () => console.log('Online status: ', this.node.isOnline() ? 'online' : 'offline'));
  }

 
  uploadIPFS = (fileArrayBuffer:Ar): Promise<Buffer> => {
    return new Promise((resolve, reject) => {

      this.setState({ progress: 0 });
  
      const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
        chunkSize: 25000, 
      });
     
      myReadableStreamBuffer.on('data', (chunk: Buffer) => {
        this.setState({ progress: this.state.progress + chunk.byteLength });
        myReadableStreamBuffer.resume();
      });

      this.stream = this.node.files.addReadableStream();

      this.stream.on('data', (file: Buffer) => resolve(file));

      this.stream.write(myReadableStreamBuffer);
      myReadableStreamBuffer.put(Buffer.from(fileArrayBuffer));
      myReadableStreamBuffer.on('end', () => this.stream.end());
      myReadableStreamBuffer.stop();
    });
  };

  
  readFile(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = event => resolve(this.uploadIPFS(event.target.result));
      fileReader.onerror = reject;
      fileReader[this.props.readAs](file);
    });
  }


  resetState() {
    this.setState({ text: '', files: [] });
  }


  async handleChange(event: SyntheticInputEvent<EventTarget>) {
    const files: File[] = Array.from(event.target.files);
    if (!files.length) {
      return this.resetState();
    }
    const errMsg = this.props.validateFiles(files);
    if (errMsg) {
      this.resetState();
      return this.props.onReadFailure(errMsg);
    }


    const text = files.length > 1 ? `${files.length} files...` : files[0].name;
    this.setState({ text, files });
    let totalFileSize = 0;
    files.forEach(file => {
      totalFileSize += file.size;
    });
    this.setState({ totalFileSize });

    try {
      const response = await Promise.all([...files.map(aFile => this.readFile(aFile))]);
      this.props.onReadSuccess(response);
    } catch (err) {
      this.resetState();
      this.props.onReadFailure(err.message);
    }
  }

  render() {
    return (
      <span className={this.props.className}>
        {}
        <input
          placeholder={this.props.allowMultiple ? 'Select files' : 'Select a file'}
          value={this.state.text}
          readOnly
          onClick={() => this.fileInput.click()}
          {...this.props.inputProps}
        />
        {}
        <input
          style={{ display: 'none' }}
          ref={el => (this.fileInput = el)}
          type="file"
          multiple={this.props.allowMultiple}
          onChange={e => this.handleChange(e)}
          {...this.props.fileInputProps}
        />
        <ProgressBar progress={this.state.progress} total={this.state.totalFileSize} />
      </span>
    );
  }
}
