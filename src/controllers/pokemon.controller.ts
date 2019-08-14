import { Request, Response } from "express";

import Pokemon from "../models/Pokemon";
import Type from "../models/Type";

class PokemonController {

    /**
     * Find all Pokemons
     *
     * @param req
     * @param res
     *
     * @returns {Promise<void>}
     */
    public findAllPokemon(req: Request, res: Response) {

        try {
            const populateQuery = [
                { path:'evolution', select:'name picture number' },
                { path:'types', select:'name color' },
                { path:'weaknesses', select:'name color' }
            ];

            Pokemon.find({}, (error, pokemons) => {
                if (error) {
                    throw error;
                }

                return res.status(200).json(pokemons);

            }).populate(populateQuery);
        } catch(error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    };

    /**
     * Find a Pokemon by slug
     *
     * @param req
     * @param res
     *
     * @returns {Promise<void>}
     */
    public findPokemonBySlug = async(req, res) => {
        const populateQuery = [
            { path:'types', select:'name color' },
            { path:'weaknesses', select:'name color' },
            { path:'evolutions.parent.pokemon', select:'name' },
            { path:'evolutions.children.pokemon', select:'name' }
        ];

        try {
            const pokemon = await Pokemon.find({ slug: req.params.slug }).populate(populateQuery);

            if (pokemon.length === 0) {
                throw new Error('Pokemon does not exist');
            }

            res.status(200).json(pokemon);

        } catch(error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    };

    /**
     * Create a Pokemon
     *
     * @param req
     * @param res
     *
     * @returns {Promise<void>}
     */
    public createPokemon = async(req, res) => {
        try {
            const pokemon = new Pokemon(req.body);
            await pokemon.save();

            res.status(200).send(pokemon);
        } catch(error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    };

    /**
     * Update a Pokemon
     *
     * @param req
     * @param res
     *
     * @returns {Promise<void>}
     */
    public updatePokemon = async(req, res) => {
        try {
            const pokemon = await Pokemon.findOneAndUpdate({ slug: req.params.slug }, req.body);

            if (!pokemon) {
                return res.status(404).json({ message: "Ce Pokemon n'existe pas. Erreur lors de la modification.", success: false });
            }

            await res.status(201).send(pokemon);

            res.status(200).send(pokemon);
        } catch (error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    };

    /**
     * Delete a Pokemon
     *
     * @param req
     * @param res
     *
     * @returns {Promise<void>}
     */
    public async deletePokemon(req: Request, res: Response) {
        try {
            const pokemon = await Pokemon.findOneAndDelete({ slug: req.params.slug });

            if (!pokemon) {
                return res.status(404).json({ message: "Ce Pokemon n'existe pas. Erreur lors de la suppression." });
            }

            res.status(200).json({
                status: 'success',
                message: 'Le Pokemon a été été supprimé avec succès'
            });
        } catch (error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    };

    /**
     * Get Pokemons by the generation
     *
     * @param {e.Request} req
     * @param {e.Response} res
     *
     * @returns {Promise<void>}
     */
    public async filterByGeneration(req: Request, res: Response) {
        try {

            const generations = req.body.generations;

            const pokemons = await Pokemon.find({ generation: { $in: generations } });

            res.status(200).json(pokemons);

        } catch (error) {
            res.status(500).send({ message: error.message, success: "false" });
        }
    }

    /**
     * Get Pokemons by their type
     *
     * @param {Request} req
     * @param {Response} res
     *
     * @returns {Promise<void>}
     */
    public async filterByTypes(req: Request, res: Response) {
        try {
            const types = req.body.types;
            const typeIds = [];

            // Get each types by its name
            const findTypes = await Type.find({ name: { $in: types } });

            // Get the ID of the type and push it in an array
            findTypes.forEach(type => {
                typeIds.push(type._id.toString());
            });

            // For each type IDs, find Pokemons associated for each type in the typeIds array
            const pokemons = await Pokemon.find({ types: { $in: typeIds } });

            res.status(200).json(pokemons);

        } catch (error) {
            console.log(error);
            res.status(500).send({ message: error.message, success: "false" });
        }
    }
}

export default PokemonController;
