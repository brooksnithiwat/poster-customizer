import TextPanel from './TextPanel.jsx';
import ObjectivesPanel from './ObjectivesPanel.jsx';
import PhotoPanel from './PhotoPanel.jsx';
// import FontsPanel from './FontsPanel.jsx'; // font loading hidden

export default function Sidebar(props) {
  const { poster, elements, selectedEl, selectedKey, fonts, customFonts, busy, actions, getAsset } = props;
  const disabled = !poster;
  const objectivesEl = elements.find((el) => el.type === 'objectives') || null;
  const photo = elements.find((el) => el.type === 'image') || null;

  return (
    <aside className="sidebar">
      <PhotoPanel
        photo={photo}
        getAsset={getAsset}
        disabled={disabled || busy}
        onUpload={actions.setPhoto}
        onUpdate={actions.update}
        onRemove={actions.remove}
      />
      <TextPanel
        elements={elements}
        selectedEl={selectedEl}
        fonts={fonts}
        disabled={disabled}
        onSetRoleText={actions.setRoleText}
        onAddText={actions.addText}
        onSelect={actions.select}
        onUpdate={actions.update}
        onRemove={actions.remove}
      />
      <ObjectivesPanel
        el={objectivesEl}
        fonts={fonts}
        disabled={disabled}
        selectedKey={selectedKey}
        onUpdate={actions.update}
        onSelect={actions.select}
      />
      {/* <FontsPanel customFonts={customFonts} onFontFile={actions.loadFont} /> */}
      <footer className="credit">
        <div>จัดทำโดย Sinbad Thethird สุดหล่อ</div>
        <small>© {new Date().getFullYear()} Sinbad Thethird. All rights reserved.</small>
      </footer>
    </aside>
  );
}
