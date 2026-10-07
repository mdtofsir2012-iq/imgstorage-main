export const dynamic = 'force-dynamic';

export default function DocsPage() {
  const baseUrl = 'https://imgstorage1.vercel.app'

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/upload',
      description: 'Upload an image file using multipart/form-data.',
      headers: {
        'x-api-key': 'Your API Key',
      },
      body: 'multipart/form-data with key `image` (max 4MB)',
      response: 'JSON containing image URL and ID',
    },
    {
      method: 'GET',
      path: '/api/v1/images',
      description: 'List all uploaded images for your API key.',
      headers: {
        'x-api-key': 'Your API Key',
      },
      response: 'Array of image objects',
    },
    {
      method: 'DELETE',
      path: '/api/v1/images/:slug',
      description: 'Delete an image by its slug.',
      headers: {
        'x-api-key': 'Your API Key',
      },
      response: 'Success status',
    },
  ]

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-white">API Documentation</h1>
        <p className="text-sm text-[#555] mt-1">
          Integrate ImgStorage into your applications using our simple REST API
        </p>
      </div>

      <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-white">Base URL</h2>
        <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-4 py-3 font-mono text-xs text-[#ccc]">
          {baseUrl}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-medium text-white">Endpoints</h2>

        {endpoints.map((ep, i) => (
          <div key={i} className="bg-[#111] border border-white/[0.06] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded font-mono ${
                ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {ep.method}
              </span>
              <span className="font-mono text-xs text-white">{ep.path}</span>
            </div>

            <p className="text-xs text-[#888]">{ep.description}</p>

            {ep.headers && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-[#666]">Headers:</span>
                <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-lg p-3 font-mono text-[11px] text-[#ccc] space-y-1">
                  {Object.entries(ep.headers).map(([k, v]) => (
                    <div key={k}><span className="text-gray-500">{k}:</span> {v}</div>
                  ))}
                </div>
              </div>
            )}

            {ep.body && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-[#666]">Body:</span>
                <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-lg p-3 font-mono text-[11px] text-[#ccc]">
                  {ep.body}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-medium text-[#666]">Response:</span>
              <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-lg p-3 font-mono text-[11px] text-[#ccc]">
                {ep.response}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
