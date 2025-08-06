(() => {
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

  function UserMenu() {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      function handleDocumentClick(e) {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setIsUserMenuOpen(false);
        }
      }
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }, []);

    return React.createElement(
      'div',
      { ref: menuRef },
      React.createElement(
        'button',
        {
          className: 'user-btn',
          onClick: (e) => {
            e.stopPropagation();
            setIsUserMenuOpen(!isUserMenuOpen);
          }
        },
        React.createElement('i', { className: 'fas fa-user-circle' }),
        React.createElement('span', { id: 'user-name' }, 'Usuário'),
        React.createElement('i', { className: 'fas fa-chevron-down' })
      ),
      React.createElement(
        'div',
        { className: `user-dropdown${isUserMenuOpen ? ' show' : ''}` },
        React.createElement(
          'a',
          {
            href: '#',
            id: 'user-profile',
            onClick: (e) => {
              e.preventDefault();
              window.navigation && window.navigation.showUserProfile();
              setIsUserMenuOpen(false);
            }
          },
          React.createElement('i', { className: 'fas fa-user' }),
          ' Perfil'
        ),
        React.createElement(
          'a',
          {
            href: '#',
            id: 'user-settings',
            onClick: (e) => {
              e.preventDefault();
              window.navigation && window.navigation.showUserSettings();
              setIsUserMenuOpen(false);
            }
          },
          React.createElement('i', { className: 'fas fa-cog' }),
          ' Configurações'
        ),
        React.createElement('hr', null),
        React.createElement(
          'a',
          {
            href: '#',
            id: 'logout',
            onClick: (e) => {
              e.preventDefault();
              window.navigation && window.navigation.handleLogout();
              setIsUserMenuOpen(false);
            }
          },
          React.createElement('i', { className: 'fas fa-sign-out-alt' }),
          ' Sair'
        )
      )
    );
  }

  const rootElement = document.getElementById('user-menu-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(UserMenu));
  }
})();
