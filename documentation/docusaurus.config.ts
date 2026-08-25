import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import gruvboxAutumnDark from './src/prism/gruvboxAutumnDark';

const config: Config = {
  title: 'Autumn Documentation',
  tagline: 'Documentation for Autumn, a self-hosted job application tracker.',
  favicon: 'img/favicon.png',
  future: {
    v4: true,
  },
  url: 'https://Norman-bury.github.io',
  baseUrl: '/autumn/',
  organizationName: 'Norman-bury',
  projectName: 'autumn',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Norman-bury/autumn/edit/main/documentation/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Autumn',
      items: [
        {
          type: 'doc',
          docId: 'install/index',
          position: 'left',
          label: 'Install',
        },
        {
          href: 'https://github.com/Norman-bury/autumn',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Home',
              to: '/',
            },
            {
              label: 'Install Autumn',
              to: '/install',
            },
            {
              label: 'Get started in Autumn',
              to: '/get-started',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Repository',
              href: 'https://github.com/Norman-bury/autumn',
            },
            {
              label: 'Releases',
              href: 'https://github.com/Norman-bury/autumn/releases',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Autumn. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.gruvboxMaterialLight,
      darkTheme: gruvboxAutumnDark,
      additionalLanguages: ['bash', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
