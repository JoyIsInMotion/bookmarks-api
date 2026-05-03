'use client';

import React, { useState } from 'react';

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-gray-900 text-green-400 p-3 mt-1 text-xs overflow-x-auto rounded border border-gray-700">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">📚 Bookmarks API</h1>
          <p className="text-xl text-gray-600">A minimalistic REST API for managing your bookmarks</p>
          <p className="text-sm text-gray-500 mt-2">Built with Next.js, TypeScript, and JWT Authentication</p>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Getting Started</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Test Users (Password: password)</h3>
              <code className="bg-gray-100 p-2 block text-sm text-gray-900">
                alice@example.com | bob@example.com | charlie@example.com
              </code>
            </div>
            <p className="text-gray-600">All timestamps use ISO 8601 format. Use pagination with the page query parameter.</p>
          </div>
        </div>

        {/* Authentication Endpoints */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🔐 Authentication</h2>
          
          <div className="space-y-6">
            {/* Register */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Register</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">POST /api/auth/register</code>
              <p className="text-gray-600 text-sm mt-2">Create a new user account</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">Request body</summary>
                <CodeBlock
                  code={`{
  "email": "user@example.com",
  "password": "secure-password"
}`}
                />
              </details>
            </div>

            {/* Login */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Login</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">POST /api/auth/login</code>
              <p className="text-gray-600 text-sm mt-2">Authenticate and receive a JWT token</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">Request body</summary>
                <CodeBlock
                  code={`{
  "email": "alice@example.com",
  "password": "password"
}`}
                />
              </details>
            </div>

            {/* Me */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Get Current User</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">GET /api/auth/me</code>
              <p className="text-gray-600 text-sm mt-2">Get information about the authenticated user</p>
              <p className="text-xs text-gray-500 mt-2">✓ Requires: Bearer token in Authorization header</p>
            </div>

            {/* Logout */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Logout</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">POST /api/auth/logout</code>
              <p className="text-gray-600 text-sm mt-2">Invalidate the current session</p>
            </div>
          </div>
        </div>

        {/* Bookmark Endpoints */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📖 Bookmarks (Protected)</h2>
          <p className="text-gray-600 mb-6">All bookmark endpoints require authentication with a valid JWT token</p>
          
          <div className="space-y-6">
            {/* List Bookmarks */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">List Bookmarks</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">GET /api/bookmarks?page=1</code>
              <p className="text-gray-600 text-sm mt-2">Get paginated list of user's bookmarks (5 per page)</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">Response example</summary>
                <CodeBlock
                  code={`{
  "data": [
    {
      "id": "bm-1",
      "userId": "user-1",
      "url": "https://github.com",
      "description": "GitHub - Where the world builds software",
      "createdAt": "2026-05-03T10:30:15.234Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 12,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}`}
                />
              </details>
            </div>

            {/* Create Bookmark */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Bookmark</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">POST /api/bookmarks</code>
              <p className="text-gray-600 text-sm mt-2">Add a new bookmark to your collection</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">Request body</summary>
                <CodeBlock
                  code={`{
  "url": "https://example.com",
  "description": "Optional description"
}`}
                />
              </details>
            </div>

            {/* Get Bookmark */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Get Bookmark</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">GET /api/bookmarks/[id]</code>
              <p className="text-gray-600 text-sm mt-2">Retrieve a specific bookmark by ID</p>
            </div>

            {/* Update Bookmark */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Update Bookmark</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">PUT /api/bookmarks/[id]</code>
              <p className="text-gray-600 text-sm mt-2">Update URL or description of a bookmark</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">Request body</summary>
                <CodeBlock
                  code={`{
  "url": "https://new-url.com",
  "description": "Updated description"
}`}
                />
              </details>
            </div>

            {/* Delete Bookmark */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800">Delete Bookmark</h3>
              <code className="bg-gray-900 text-green-400 text-sm block mt-2 p-2 rounded">DELETE /api/bookmarks/[id]</code>
              <p className="text-gray-600 text-sm mt-2">Delete a bookmark from your collection</p>
            </div>
          </div>
        </div>

        {/* Data Model */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Data Model</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* User */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-3">User</h3>
              <CodeBlock
                code={`{
  "id": "user-1",
  "email": "user@example.com",
  "password": "encrypted"
}`}
              />
            </div>

            {/* Bookmark */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-3">Bookmark</h3>
              <CodeBlock
                code={`{
  "id": "bm-1",
  "userId": "user-1",
  "url": "https://example.com",
  "description": "optional",
  "createdAt": "2026-05-03T10:30:15.234Z"
}`}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">✨ Features</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>JWT-based authentication</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Password encryption with PBKDF2</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>User isolation (own bookmarks only)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Pagination support</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>JSON file-based storage</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Sample data with multiple users</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>Built with ❤️ using Next.js 16, TypeScript, and Jose</p>
        </div>
      </div>
    </div>
  );
}
