/* =========================================================
   SCROLL REVEAL
========================================================= */

const observer = new IntersectionObserver(

    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            }

        });

    },

    {
        threshold: 0.1
    }

);


document
    .querySelectorAll(".reveal")
    .forEach((element) => {

        observer.observe(element);

    });


/* =========================================================
   REDE / GLOBO INTERATIVO
========================================================= */

const canvas =
    document.getElementById("networkCanvas");

const stage =
    document.querySelector(".network-stage");

const ctx =
    canvas.getContext("2d");


let width = 0;
let height = 0;

let centerX = 0;
let centerY = 0;

let radius = 0;

let dpr =
    Math.min(window.devicePixelRatio || 1, 2);


/*
 * Configuração do globo
 */

const POINT_COUNT = 190;

const points = [];

const edges = [];


/*
 * Estado da rotação
 */

let rotationX = -0.12;
let rotationY = 0.35;

let targetRotationX = -0.12;
let targetRotationY = 0.35;

let zoom = 1;

let dragging = false;

let lastPointerX = 0;
let lastPointerY = 0;

let velocityX = 0;
let velocityY = 0;


/*
 * Criação dos pontos utilizando
 * distribuição Fibonacci.
 */

function createPoints() {

    points.length = 0;

    const goldenAngle =
        Math.PI *
        (3 - Math.sqrt(5));


    for (
        let i = 0;
        i < POINT_COUNT;
        i++
    ) {

        const y =
            1 -
            (i / (POINT_COUNT - 1)) * 2;


        const radiusAtY =
            Math.sqrt(
                1 - y * y
            );


        const theta =
            goldenAngle * i;


        const x =
            Math.cos(theta) *
            radiusAtY;


        const z =
            Math.sin(theta) *
            radiusAtY;


        points.push({

            x,
            y,
            z,

            px: 0,
            py: 0,

            depth: 0

        });

    }

}


/*
 * Criação das conexões.
 */

function createEdges() {

    edges.length = 0;

    const MAX_NEIGHBORS = 3;

    const connections =
        new Set();


    for (
        let i = 0;
        i < points.length;
        i++
    ) {

        const distances = [];


        for (
            let j = 0;
            j < points.length;
            j++
        ) {

            if (i === j) {
                continue;
            }


            const dx =
                points[i].x -
                points[j].x;


            const dy =
                points[i].y -
                points[j].y;


            const dz =
                points[i].z -
                points[j].z;


            const distance =
                dx * dx +
                dy * dy +
                dz * dz;


            distances.push({
                index: j,
                distance
            });

        }


        distances.sort(
            (a, b) =>
                a.distance -
                b.distance
        );


        for (
            let n = 0;
            n < MAX_NEIGHBORS;
            n++
        ) {

            const j =
                distances[n].index;


            const a =
                Math.min(i, j);

            const b =
                Math.max(i, j);


            const key =
                `${a}-${b}`;


            if (
                !connections.has(key)
            ) {

                connections.add(key);

                edges.push([a, b]);

            }

        }

    }

}


/*
 * Redimensionamento do canvas.
 */

function resizeCanvas() {

    const rect =
        stage.getBoundingClientRect();


    width = rect.width;
    height = rect.height;


    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    canvas.style.width =
        `${width}px`;


    canvas.style.height =
        `${height}px`;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    centerX =
        width / 2;


    centerY =
        height / 2;


    radius =
        Math.min(
            width,
            height
        ) * 0.37;


    radius *= zoom;

}


/*
 * Rotação 3D.
 */

function rotatePoint(point) {

    let x = point.x;
    let y = point.y;
    let z = point.z;


    /*
     * Rotação Y
     */

    const cosY =
        Math.cos(rotationY);

    const sinY =
        Math.sin(rotationY);


    const x1 =
        x * cosY -
        z * sinY;


    const z1 =
        x * sinY +
        z * cosY;


    /*
     * Rotação X
     */

    const cosX =
        Math.cos(rotationX);

    const sinX =
        Math.sin(rotationX);


    const y1 =
        y * cosX -
        z1 * sinX;


    const z2 =
        y * sinX +
        z1 * cosX;


    return {
        x: x1,
        y: y1,
        z: z2
    };

}


/*
 * Projeção.
 */

function projectPoint(point) {

    const rotated =
        rotatePoint(point);


    const perspective =
        1.05 /
        (1.65 - rotated.z);


    return {

        x:
            centerX +
            rotated.x *
            radius *
            perspective,

        y:
            centerY +
            rotated.y *
            radius *
            perspective,

        depth:
            (rotated.z + 1) / 2

    };

}


/*
 * Desenha o brilho externo
 * do globo.
 */

function drawGlobeGlow() {

    const gradient =
        ctx.createRadialGradient(
            centerX,
            centerY,
            radius * 0.15,
            centerX,
            centerY,
            radius * 1.25
        );


    gradient.addColorStop(
        0,
        "rgba(185,255,70,0.025)"
    );


    gradient.addColorStop(
        0.55,
        "rgba(185,255,70,0.012)"
    );


    gradient.addColorStop(
        1,
        "rgba(185,255,70,0)"
    );


    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius * 1.2,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        gradient;

    ctx.fill();


    /*
     * Anel externo
     */

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius * 1.02,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(185,255,70,0.055)";

    ctx.lineWidth = 1;

    ctx.stroke();

}


/*
 * Desenha as conexões.
 */

function drawEdges(projected) {

    edges.forEach(
        ([a, b]) => {

            const p1 =
                projected[a];

            const p2 =
                projected[b];


            const averageDepth =
                (
                    p1.depth +
                    p2.depth
                ) / 2;


            /*
             * Linhas atrás do globo
             * ficam muito discretas.
             */

            if (
                averageDepth < 0.18
            ) {
                return;
            }


            const alpha =
                0.035 +
                averageDepth * 0.16;


            ctx.beginPath();


            ctx.moveTo(
                p1.x,
                p1.y
            );


            ctx.lineTo(
                p2.x,
                p2.y
            );


            ctx.strokeStyle =
                `rgba(185,255,70,${alpha})`;


            ctx.lineWidth =
                0.55 +
                averageDepth * 0.35;


            ctx.stroke();

        }
    );

}


/*
 * Desenha os pontos.
 */

function drawPoints(projected) {

    projected.forEach(
        (point) => {

            const depth =
                point.depth;


            if (
                depth < 0.05
            ) {
                return;
            }


            const size =
                0.65 +
                depth * 2.15;


            const alpha =
                0.22 +
                depth * 0.78;


            /*
             * Glow
             */

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                size * 3.2,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                `rgba(185,255,70,${alpha * 0.06})`;


            ctx.fill();


            /*
             * Núcleo
             */

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                size,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                `rgba(185,255,70,${alpha})`;


            ctx.shadowColor =
                "rgba(185,255,70,0.75)";


            ctx.shadowBlur =
                5 + depth * 5;


            ctx.fill();


            ctx.shadowBlur = 0;

        }
    );

}


/*
 * Pequenos pontos orbitais
 * fora da esfera.
 */

function drawOrbitDots(time) {

    const orbitRadius =
        radius * 1.04;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const angle =
            time * 0.00015 +
            i *
            (Math.PI * 2 / 7);


        const x =
            centerX +
            Math.cos(angle) *
            orbitRadius;


        const y =
            centerY +
            Math.sin(angle) *
            orbitRadius *
            0.35;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            1.2,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(185,255,70,0.42)";


        ctx.fill();

    }

}


/*
 * Loop principal.
 */

function animate(time) {

    requestAnimationFrame(
        animate
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
     * Rotação automática
     * quando não há interação.
     */

    if (!dragging) {

        targetRotationY +=
            0.0015;

        targetRotationX +=
            Math.sin(time * 0.00025)
            * 0.00012;

        /*
         * Inércia do arrasto.
         */

        targetRotationY +=
            velocityX;

        targetRotationX +=
            velocityY;


        velocityX *= 0.94;
        velocityY *= 0.94;

    }


    /*
     * Suavização.
     */

    rotationY +=
        (
            targetRotationY -
            rotationY
        ) * 0.055;


    rotationX +=
        (
            targetRotationX -
            rotationX
        ) * 0.055;


    /*
     * Limita a rotação vertical.
     */

    targetRotationX =
        Math.max(
            -1.2,
            Math.min(
                1.2,
                targetRotationX
            )
        );


    drawGlobeGlow();


    const projected =
        points.map(
            projectPoint
        );


    /*
     * Ordenação por profundidade.
     */

    projected.sort(
        (a, b) =>
            a.depth -
            b.depth
    );


    /*
     * Como as conexões
     * usam os índices originais,
     * precisamos criar um novo array
     * para desenho das linhas.
     */

    const projectedOriginal =
        points.map(
            projectPoint
        );


    drawEdges(
        projectedOriginal
    );


    drawPoints(
        projected
    );


    drawOrbitDots(time);

}


/*
 * Interação com mouse/touch.
 */

canvas.addEventListener(
    "pointerdown",
    (event) => {

        dragging = true;

        canvas.classList.add(
            "dragging"
        );


        lastPointerX =
            event.clientX;


        lastPointerY =
            event.clientY;


        canvas.setPointerCapture(
            event.pointerId
        );

    }
);


canvas.addEventListener(
    "pointermove",
    (event) => {

        if (!dragging) {
            return;
        }


        const deltaX =
            event.clientX -
            lastPointerX;


        const deltaY =
            event.clientY -
            lastPointerY;


        lastPointerX =
            event.clientX;


        lastPointerY =
            event.clientY;


        const sensitivity =
            0.006;


        velocityX =
            deltaX *
            sensitivity *
            0.35;


        velocityY =
            deltaY *
            sensitivity *
            0.35;


        targetRotationY +=
            deltaX *
            sensitivity;


        targetRotationX +=
            deltaY *
            sensitivity;

    }
);


function stopDragging(event) {

    dragging = false;

    canvas.classList.remove(
        "dragging"
    );


    try {

        canvas.releasePointerCapture(
            event.pointerId
        );

    } catch (error) {
        // Ignorar
    }

}


canvas.addEventListener(
    "pointerup",
    stopDragging
);


canvas.addEventListener(
    "pointercancel",
    stopDragging
);


canvas.addEventListener(
    "pointerleave",
    (event) => {

        if (
            dragging &&
            event.pointerType === "mouse"
        ) {

            stopDragging(event);

        }

    }
);


/*
 * Zoom com roda do mouse.
 */

canvas.addEventListener(
    "wheel",
    (event) => {

        event.preventDefault();


        zoom +=
            event.deltaY > 0
                ? -0.05
                : 0.05;


        zoom =
            Math.max(
                0.78,
                Math.min(
                    1.22,
                    zoom
                )
            );


        resizeCanvas();

    },
    {
        passive: false
    }
);


/*
 * Inicialização.
 */

createPoints();

createEdges();

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


requestAnimationFrame(
    animate
);