import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { COLLISIONBOX_VISIBILITY } from "./settings";

export class Environment {
    private _scene: Scene;
    private _successTriggers: Array<Mesh>;
    private _failureTriggers: Array<Mesh>;

    constructor(scene: Scene) {
        this._scene = scene;
        this._successTriggers = [];
        this._failureTriggers = [];
    }

    public async load() {
        await SceneLoader.ImportMeshAsync(null, "./assets/models/", "ground.glb", this._scene).then((result) => {
            const root = result.meshes[0];

            // Disable mesh in the collision engine. 
            root.getChildMeshes().forEach(mesh => {
                if(!mesh.name.includes("collision")) {
                    mesh.isPickable = false;
                    mesh.checkCollisions = false;
                } else {
                    console.log(mesh.isPickable);
                    console.log(mesh.checkCollisions);

                    //mesh.checkCollisions = true;
                    
                    mesh.visibility = COLLISIONBOX_VISIBILITY;
                    return;
                }
                if(mesh.name.includes("trigger")) {
                    if(mesh.name.includes("success")) {
                        mesh.isPickable = false;
                        mesh.checkCollisions = false;

                        this._successTriggers.push(mesh as Mesh);
                    }
                    if(mesh.name.includes("failure")) {
                        mesh.isPickable = false;
                        mesh.checkCollisions = false;

                        this._failureTriggers.push(mesh as Mesh);
                    }
                }
            });
        });
    }

    public get successTriggers(): Array<Mesh> {
        return this._successTriggers;
    }

    public get failureTriggers(): Array<Mesh> {
        return this._failureTriggers;
    }
}
