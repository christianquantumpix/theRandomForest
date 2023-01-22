import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Player } from "./CharacterController";

/**
 * Class for a companion that will follow the player around. 
 */
export class Companion {
    private scene: Scene;
    private mesh: Mesh;
    private player: Player;

    /**
     * Creates a a companion that will follow the player around. 
     */
    constructor(scene: Scene, mesh: Mesh, player: Player) {
        this.scene = scene;
        this.mesh = mesh;
        this.player = player;
    }

    /**
     * Registers a function to the render loop that will make the companion follow the player around. 
     */
    followPlayer() {
        let followPlayer = () => {

            let vectorToPlayer = this.player.mesh.position.subtract(this.mesh.position);
            let distanceToPlayer = vectorToPlayer.length();

            if(distanceToPlayer > 2) {
                this.mesh.position.addInPlace(vectorToPlayer.scale(0.01));
            }
        }

        this.scene.registerBeforeRender(followPlayer);
    }
}
