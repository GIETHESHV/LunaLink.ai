# Integrate Mind Map Visual Mode MVP into LunaLink

## Step 1: Move Mind Map Components to Next.js
- [x] Create lunalink/components/mindmap/ folder
- [x] Copy and adapt MindMapCanvas.tsx, MindMapNode.tsx, MindMapConnection.tsx from Mind Map/src/components/
- [x] Copy other components: Header.tsx, BottomToolbar.tsx, etc.
- [x] Install missing dependencies: framer-motion (motion)

## Step 2: Update Dashboard for Mode Toggle
- [x] Add mode state ('chat' | 'mindmap') to dashboard page.js
- [x] Add toggle button in header to switch modes
- [x] Conditionally render chat UI or MindMapCanvas based on mode
- [x] Pass data from API to MindMapCanvas
- [x] Add tutorial overlay with close functionality

## Step 3: Modify Backend for Mind Map Support
- [ ] Integrate src/chatbot.py logic into backend/main.py
- [ ] Add /mindmap endpoint that returns JSON structure
- [ ] Update /chat endpoint to accept mode parameter
- [ ] Generate structured mind map data from AI response

## Step 4: Adapt Mind Map Components for Dynamic Data
- [x] Modify MindMapCanvas to accept data prop instead of hardcoded nodes
- [ ] Implement node expansion on click (recursive API calls)
- [ ] Add loading states and error handling

## Step 5: Testing and Integration
- [ ] Test mode switching in dashboard
- [ ] Test mind map rendering with sample data
- [ ] Test API endpoints
- [ ] Ensure TTS works with mind map mode
