-- Phase 1: Group Chat Infrastructure Database Schema

-- Group chat containers
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  chat_type TEXT DEFAULT 'general', -- 'general', 'gift_project', 'family', 'occasion'
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Group membership and permissions
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- 'admin', 'member', 'viewer'
  can_invite BOOLEAN DEFAULT false,
  can_manage_gifts BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  UNIQUE(group_chat_id, user_id)
);

-- Group gift projects for collaborative gifting
CREATE TABLE IF NOT EXISTS group_gift_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id),
  project_name TEXT NOT NULL,
  target_product_id TEXT, -- Zinc product ID
  target_product_name TEXT,
  target_product_image TEXT,
  target_product_price DECIMAL(10,2),
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  coordinator_id UUID NOT NULL REFERENCES profiles(id),
  recipient_name TEXT,
  recipient_id UUID REFERENCES profiles(id), -- If recipient is in system
  delivery_address JSONB, -- Shipping information
  purchase_deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'collecting', -- 'collecting', 'ready_to_purchase', 'purchased', 'shipped', 'delivered'
  order_id UUID REFERENCES orders(id), -- Links to actual order when purchased
  stripe_group_payment_intent_id TEXT, -- For coordinated payments
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual contributions tracking
CREATE TABLE IF NOT EXISTS group_gift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_gift_project_id UUID NOT NULL REFERENCES group_gift_projects(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES profiles(id),
  committed_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  stripe_payment_intent_id TEXT,
  contribution_status TEXT DEFAULT 'committed', -- 'committed', 'paid', 'refunded'
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_gift_project_id, contributor_id)
);

-- Group contributor details in orders
CREATE TABLE IF NOT EXISTS order_group_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES profiles(id),
  contribution_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Control shipment tracking access for group gifts
CREATE TABLE IF NOT EXISTS group_gift_tracking_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_gift_project_id UUID NOT NULL REFERENCES group_gift_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  access_level TEXT DEFAULT 'full', -- 'full', 'status_only', 'none'
  can_view_tracking TEXT DEFAULT 'yes', -- 'yes', 'no'
  can_view_delivery_address BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"shipping_updates": true, "delivery_updates": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_gift_project_id, user_id)
);

-- Add group support to existing messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES group_chats(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_thread_id UUID; -- For replies/mentions
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mentioned_users UUID[]; -- For @mentions

-- Add group gift support to existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_gift_project_id UUID REFERENCES group_gift_projects(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS funding_source TEXT DEFAULT 'individual'; -- 'individual', 'group_gift'

-- Enable Row Level Security
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_gift_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_gift_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_group_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_gift_tracking_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chats
CREATE POLICY "Users can view groups they are members of" ON group_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = group_chats.id 
      AND group_chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group chats" ON group_chats
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group admins can update group chats" ON group_chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = group_chats.id 
      AND group_chat_members.user_id = auth.uid()
      AND group_chat_members.role = 'admin'
    )
  );

-- RLS Policies for group_chat_members
CREATE POLICY "Users can view group members of groups they belong to" ON group_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm2
      WHERE gcm2.group_chat_id = group_chat_members.group_chat_id 
      AND gcm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage members" ON group_chat_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm2
      WHERE gcm2.group_chat_id = group_chat_members.group_chat_id 
      AND gcm2.user_id = auth.uid()
      AND gcm2.role = 'admin'
    )
  );

CREATE POLICY "Users can join groups they are invited to" ON group_chat_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for group_gift_projects
CREATE POLICY "Group members can view gift projects" ON group_gift_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = group_gift_projects.group_chat_id 
      AND group_chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members with gift management permissions can create projects" ON group_gift_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = group_gift_projects.group_chat_id 
      AND group_chat_members.user_id = auth.uid()
      AND (group_chat_members.can_manage_gifts = true OR group_chat_members.role = 'admin')
    )
  );

CREATE POLICY "Project coordinators and admins can update projects" ON group_gift_projects
  FOR UPDATE USING (
    coordinator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = group_gift_projects.group_chat_id 
      AND group_chat_members.user_id = auth.uid()
      AND group_chat_members.role = 'admin'
    )
  );

-- RLS Policies for group_gift_contributions
CREATE POLICY "Users can view contributions for their group projects" ON group_gift_contributions
  FOR SELECT USING (
    contributor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_gift_projects gp
      JOIN group_chat_members gcm ON gcm.group_chat_id = gp.group_chat_id
      WHERE gp.id = group_gift_contributions.group_gift_project_id
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own contributions" ON group_gift_contributions
  FOR ALL USING (contributor_id = auth.uid());

-- RLS Policies for order_group_contributors
CREATE POLICY "Users can view their own order contributions" ON order_group_contributors
  FOR SELECT USING (contributor_id = auth.uid());

CREATE POLICY "System can insert order contributions" ON order_group_contributors
  FOR INSERT WITH CHECK (true);

-- RLS Policies for group_gift_tracking_access
CREATE POLICY "Users can view their own tracking access" ON group_gift_tracking_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Group project coordinators can manage tracking access" ON group_gift_tracking_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_gift_projects gp
      WHERE gp.id = group_gift_tracking_access.group_gift_project_id
      AND gp.coordinator_id = auth.uid()
    )
  );

-- Update messages RLS to support group chats
DROP POLICY IF EXISTS "Users can view their conversations" ON messages;
CREATE POLICY "Users can view their conversations" ON messages
  FOR SELECT USING (
    (auth.uid() = sender_id) OR 
    (auth.uid() = recipient_id) OR
    (group_chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_members.group_chat_id = messages.group_chat_id 
      AND group_chat_members.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      recipient_id IS NOT NULL OR
      (group_chat_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_chat_members 
        WHERE group_chat_members.group_chat_id = messages.group_chat_id 
        AND group_chat_members.user_id = auth.uid()
      ))
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_chats_creator ON group_chats(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group ON group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_chat ON messages(group_chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_gift_projects_group ON group_gift_projects(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_gift_contributions_project ON group_gift_contributions(group_gift_project_id);
CREATE INDEX IF NOT EXISTS idx_group_gift_tracking_project ON group_gift_tracking_access(group_gift_project_id);

-- Enable real-time for group messaging
ALTER TABLE group_chats REPLICA IDENTITY FULL;
ALTER TABLE group_chat_members REPLICA IDENTITY FULL;
ALTER TABLE group_gift_projects REPLICA IDENTITY FULL;
ALTER TABLE group_gift_contributions REPLICA IDENTITY FULL;