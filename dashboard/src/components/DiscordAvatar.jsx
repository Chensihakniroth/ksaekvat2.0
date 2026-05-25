import React from 'react';

export default function DiscordAvatar({ userId, avatarHash, decorationAsset, size = 70 }) {
  const isCustomUrl = avatarHash && (avatarHash.startsWith('http') || avatarHash.startsWith('data:') || avatarHash.startsWith('/'));
  
  const avatarUrl = isCustomUrl
    ? avatarHash
    : avatarHash
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const decorationUrl = decorationAsset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${decorationAsset}.png?size=256&passthrough=true`
    : null;

  const decoSize = size * 1.25;

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Avatar Container (Circle clipping) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Overlaid Decoration Preset */}
      {decorationUrl && (
        <img
          src={decorationUrl}
          alt=""
          style={{
            position: 'absolute',
            width: `${decoSize}px`,
            height: `${decoSize}px`,
            maxWidth: 'none',
            maxHeight: 'none',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}
