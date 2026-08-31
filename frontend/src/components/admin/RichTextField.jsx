import React from 'react';
import ReactQuill from 'react-quill';

const modules = { toolbar: [['bold', 'italic', 'underline', 'link']] };

export default function RichTextField({ value, onChange, placeholder }) {
  return <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} placeholder={placeholder} />;
}