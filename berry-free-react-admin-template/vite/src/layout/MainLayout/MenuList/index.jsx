import { memo, useState } from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import menuItems from 'menu-items';
import { useAuth } from 'contexts/auth';
import { useGetMenuMaster } from 'api/menu';

// Simple permission check function (replace with your actual permission logic)
const hasPermission = (item, user) => {
  // Add your permission logic here
  return true;
};

// ==============================|| SIDEBAR MENU LIST ||============================== //

function MenuList() {
  const { user } = useAuth();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const [selectedID, setSelectedID] = useState('');

  // Filter menu items based on permissions
  const filteredItems = menuItems.items.filter(item => hasPermission(item, user));

  // Generate navigation items
  const navItems = filteredItems.map((item) => {
    switch (item.type) {
      case 'group':
        if (item.url) {
          return (
            <List key={item.id}>
              <NavItem item={item} level={1} isParents setSelectedID={() => setSelectedID('')} />
              <Divider sx={{ py: 0.5 }} />
            </List>
          );
        }

        return (
          <NavGroup
            key={item.id}
            setSelectedID={setSelectedID}
            selectedID={selectedID}
            item={item}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  return (
    <Box sx={{ pt: drawerOpen ? 1.5 : 0, '& > ul:first-of-type': { mt: 0 } }}>
      {navItems}
    </Box>
  );
}

export default memo(MenuList);
