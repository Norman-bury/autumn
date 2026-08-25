import {themes as prismThemes} from 'prism-react-renderer';

const gruvboxAutumnDark = {
  ...prismThemes.gruvboxMaterialDark,
  plain: {
    ...prismThemes.gruvboxMaterialDark.plain,
    color: '#ebdbb2',
    backgroundColor: '#32302f',
  },
};

export default gruvboxAutumnDark;
