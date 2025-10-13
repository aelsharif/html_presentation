import Link from 'next/link';
import { ArrowLeft, FileX } from 'lucide-react';

export default function PresentationNotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <FileX className="w-24 h-24 mx-auto text-gray-500 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Presentation Not Found</h1>
          <p className="text-gray-400 text-lg mb-8">
            The presentation or slide you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>

          <div className="text-sm text-gray-500">
            <p>If you believe this is an error, please check:</p>
            <ul className="mt-2 space-y-1">
              <li>• The presentation folder name is correct</li>
              <li>• The slide number exists in the presentation</li>
              <li>• The presentation has a valid config.json file</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}