import React from 'react';
import {Editor} from 'react-draft-wysiwyg';

const RichEditor = ({editorState, setEditorState}) => {
    return (
        <Editor
            toolbar={{
                options:
                    ["inline",
                        "blockType",
                        "fontSize",
                        "fontFamily",
                        "list",
                        // "textAlign",
                        // "colorPicker",
                        "link",
                        // "embedded",
                        "emoji",
                        "image",
                        // "remove",
                        "history"]
            }}
            editorState={editorState}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName="editorClassName"
            onEditorStateChange={e => setEditorState(e)}
        />
    );
};

export default RichEditor;