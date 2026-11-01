# Giwah Ayisha Portfolio (Netlify)

Deploy (needs Node 18+ and a free Netlify account):

1. Unzip, open a terminal in the folder, run `npm install`.
2. Run `npx netlify-cli login`, then `npx netlify-cli deploy --prod --build` (choose "Create & configure a new project").
   Or push the folder to GitHub and use "Import from Git" on Netlify. Drag-and-drop will NOT work (the admin needs the function).
3. Open your-site.netlify.app/#/admin (or the "Admin" link in the footer) and create a password to claim the site.
   Do this straight away, since the first visitor to claim becomes the owner.

Site data and uploaded images are stored in Netlify Blobs (no setup needed).
