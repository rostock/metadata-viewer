import { LayerContentTreeItem } from "@vcmap/ui";
import { createToggleAction } from '@vcmap/ui'; // (../src/actions/actionHelper.js)

class ContentTreeItemMetadata extends LayerContentTreeItem {

   /**
   * @type {string}
   */
  static get className() {
    return 'ContentTreeItemMetadata';
  }

  constructor(options, app) {
    super(options, app);

     /**
     * @type {string|null}
     * @private
     */
    this._infoUrl = null;
    this.infoUrl = options.infoUrl;
    this._destroyAction = null;
  };


   //ogcapi:https://geo.sv.rostock.de/metadata/collections/service/items/d0a4e64c-3743-48d6-a717-4b05473d9d39

   /**
   * @type {string|null}
   */
   get infoUrl() {
    return this._infoUrl;
  }

  /**
   * @param {string} url
   */
  set infoUrl(url) {
    check(url, maybe(String));

    if (this._infoUrl !== url) {
      this._infoUrl = url;
      const name = 'infoUrl';


      if (this._infoUrl) {
        this._destroyAction?.();
        const { action, destroy } = createToggleAction(
            {
                name,
                title: 'content.infoAction.title',
                icon: '$vcsInfo',
            },
            {
              id: 'metadataWindow',
              component: MetadataViewer,
              props: {
                infoUrl: this._infoUrl,
              }
            },
            app.windowManager,
            'myPlugin',
          );
          this._destroyAction = destroy;

        const action2 = createLinkAction(
          {
            name,
            title: 'content.infoAction.title',
            icon: '$vcsInfo',
          },
          this._infoUrl,
        );
        this.addAction(action, 6);
      } else {
        this.removeAction(name);
      }
    }
  }
  destroy() { 
    this._destroyAction();
    super.destroy();
  };

};

export default ContentTreeItemMetadata;
