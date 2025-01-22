import { Component } from './Component.js';
import * as Buttons from './buttons/index.js';
import * as Layouts from './layouts/index.js';
import * as Navbar from './navbar/index.js';
import * as Notifications from './notifications/index.js';
import * as Pages from './pages/index.js';
import * as Utilities from './utilities/index.js';
import * as Game from './game/index.js';

export {
  Component,
  ...Buttons,
  ...Layouts,
  ...Navbar,
  ...Notifications,
  ...Pages,
  ...Utilities,
  ...Game,
};
