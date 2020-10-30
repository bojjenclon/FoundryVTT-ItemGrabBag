# Item Grab Bag

This module provides a simple means of sharing items across users. This is accomplished via a dialog accessible from the Items sidebar, just above the footer. Clicking the "Open Grab Bag" button will show a popup that items can be dragged to. From there, any item can be viewed by clicking on its name, taken by a player, or removed by the GM. Items are kept in sync across clients via socket actions.

## Important Notes

* The actions are performed by the first active GM in the game. This means the Grab Bag _will not work_ if no GM is currently connected. Appropriate checks are in place to ensure players don't try to use the Grab Bag without a GM present.
* Item Grab Bag creates an item folder that it uses to keep track of items in the bag. This folder is hidden from the view by default (just for cleanliness), but changes to Foundry or system/module specific CSS may break the hiding of the folder. In any event, the folder should _not be interacted with directly_, the module relies on being able to handle this folder itself. Any modifications to the folder may break the module.
* Items in the bag have their permissions changed to be observed by all players.
