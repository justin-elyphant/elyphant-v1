
import React from 'react';

const AdminNotice = () => {
  return (
    <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg">
      <p className="font-medium mb-1">Admin Notice:</p>
      <p>
        These are Elyphant's centralized Amazon Business credentials used for all customer orders.
        Customers do not need their own Amazon accounts - they simply place orders through our platform
        and we fulfill them using this account. Keep these credentials secure and up-to-date.
      </p>
    </div>
  );
};

export default AdminNotice;
