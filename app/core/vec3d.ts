import { Node } from "./map-data"

export class Vec3D {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static FromNode(node: Node): Vec3D {
        let x = Math.sin(node.latitude) * Math.cos(node.longitude);
        let y = Math.sin(node.latitude) * Math.sin(node.longitude);
        let z = Math.cos(node.latitude);
        return new Vec3D(x, y, z);
    }

    RelativeTo(v: Vec3D): Vec3D {
        return new Vec3D(this.x - v.x,
                         this.y - v.y,
                         this.z - v.z);
    }

    Norm(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    AngleWith(v: Vec3D): number {
        // compute angle to another vector
        let dot: number = this.x*v.x + this.y*v.y + this.z*v.z;
        let angle: number = Math.acos(dot / this.Norm() / v.Norm());
        // convert to degrees
        angle = Math.round(angle * 180 / Math.PI);
        //return Math.min(angle, 360-angle);
        return angle - 180
    }
}
