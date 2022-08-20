import React, { ReactElement } from 'react';
import {
  BiCog,
  BiCodeCurly,
  BiNetworkChart,
  BiNotification,
  BiBook,
  BiTestTube,
  VscTable,
} from 'react-icons/all';
import { NavLink } from 'react-router-dom';

import Logo from '../stealthward.svg';

const Sidebar: React.FC = (): ReactElement => (
  <aside
    id="sidebar"
    className="bg-gray-800 text-gray-100 min-w-min space-y-6 pt-6 px-0 absolute inset-y-0 left-0
                transform md:relative md:translate-x-0 transition duration-200 ease-in-out  md:flex
                 md:flex-col md:justify-between max-h-screen overflow-y-auto"
    data-dev-hint="sidebar; px-0 for frameless; px-2 for visually inset the navigation"
    style={{ paddingTop: 0, background: '#072C4F' }}
  >
    <div
      className="flex flex-col space-y-6"
      data-dev-hint="optional div for having an extra footer navigation"
    >
      <a
        href="#/alerts"
        className="text-white flex items-center space-x-2"
        title="Your App is cool"
      >
        <span className="text-2xl font-extrabold whitespace-nowrap truncate">
          <img src={Logo} alt="logo" width={60} style={{ padding: 3, height: 47 }} />
        </span>
      </a>

      <nav data-dev-hint="main navigation app-nav">
        <NavLink
          to="alerts"
          className={({ isActive }) => (isActive ? 'navlink active app-nav' : 'navlink app-nav')}
        >
          <BiNotification size="1.25em" />
        </NavLink>

        <NavLink
          to="graph"
          className={({ isActive }) => (isActive ? 'navlink active app-nav' : 'navlink app-nav')}
        >
          <BiNetworkChart size="1.25em" />
        </NavLink>

        <NavLink
          to="tests"
          className={({ isActive }) => (isActive ? 'navlink active app-nav' : 'navlink app-nav')}
        >
          <BiTestTube size="1.25em" />
        </NavLink>

        <NavLink
          to="tables"
          className={({ isActive }) => (isActive ? 'navlink active disabled app-nav' : 'navlink app-nav')}
        >
          <VscTable size="1.25em" />
        </NavLink>

        <NavLink
          to="macros"
          className={({ isActive }) => (isActive ? 'navlink active app-nav' : 'navlink app-nav')}
        >
          <BiCodeCurly size="1.25em" />
        </NavLink>

        <div className="mt-5">
          <NavLink
            to="settings"
            className={({ isActive }) => (isActive ? 'navlink active app-nav' : 'navlink app-nav')}
          >
            <BiCog size="1.25em" />
          </NavLink>
        </div>
      </nav>
    </div>

    <nav data-dev-hint="second-main-navigation or footer navigation">
      <a
        href="https://app.gitbook.com/s/-Maa_pD1LwripkxgIEPj/products/data-observability/stealthward/"
        target="_blank"
        rel="noopener noreferrer"
        className="app-nav flex items-center space-x-2 mb-3 py-2 px-4 transition duration-200 hover:bg-gray-700 hover:text-white"
      >
        <BiBook size="1.25em" />
      </a>
    </nav>
  </aside>
);

export default Sidebar;
