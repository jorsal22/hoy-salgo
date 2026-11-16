import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function ExpandableText({ text, lines = 3, style, linkStyle }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : lines}
        onTextLayout={(event) => {
          if (!expanded) setTruncated(event.nativeEvent.lines.length > lines);
        }}
      >
        {text}
      </Text>
      {truncated || expanded ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Ver menos' : 'Ver más'}
          onPress={() => setExpanded((value) => !value)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[{ color: '#6EE7B7', fontSize: 13, fontWeight: '800', marginTop: 4 }, linkStyle]}>
            {expanded ? 'Ver menos' : 'Ver más'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </>
  );
}
