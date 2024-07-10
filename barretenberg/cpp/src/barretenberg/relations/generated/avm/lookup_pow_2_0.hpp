#pragma once

#include "barretenberg/relations/generic_lookup/generic_lookup_relation.hpp"

#include <cstddef>
#include <tuple>

namespace bb {

class lookup_pow_2_0_lookup_settings {
  public:
    static constexpr size_t READ_TERMS = 1;
    static constexpr size_t WRITE_TERMS = 1;
    static constexpr size_t READ_TERM_TYPES[READ_TERMS] = { 0 };
    static constexpr size_t WRITE_TERM_TYPES[WRITE_TERMS] = { 0 };
    static constexpr size_t LOOKUP_TUPLE_SIZE = 2;
    static constexpr size_t INVERSE_EXISTS_POLYNOMIAL_DEGREE = 4;
    static constexpr size_t READ_TERM_DEGREE = 0;
    static constexpr size_t WRITE_TERM_DEGREE = 0;

    template <typename Polynomials>
    static inline auto inverse_polynomial_is_computed_at_row(const Polynomials& in, size_t row)
    {
        return (in.alu_sel_shift_which[row] == 1 || in.main_sel_rng_8[row] == 1);
    }

    template <typename Accumulator, typename AllEntities>
    static inline auto compute_inverse_exists(const AllEntities& in)
    {
        using View = typename Accumulator::View;
        const auto is_operation = View(in.alu_sel_shift_which);
        const auto is_table_entry = View(in.main_sel_rng_8);
        return (is_operation + is_table_entry - is_operation * is_table_entry);
    }

    template <typename AllEntities> static inline auto get_const_entities(const AllEntities& in)
    {
        return std::forward_as_tuple(in.lookup_pow_2_0,
                                     in.lookup_pow_2_0_counts,
                                     in.alu_sel_shift_which,
                                     in.main_sel_rng_8,
                                     in.alu_ib,
                                     in.alu_two_pow_s,
                                     in.main_clk,
                                     in.powers_power_of_2);
    }

    template <typename AllEntities> static inline auto get_nonconst_entities(AllEntities& in)
    {
        return std::forward_as_tuple(in.lookup_pow_2_0,
                                     in.lookup_pow_2_0_counts,
                                     in.alu_sel_shift_which,
                                     in.main_sel_rng_8,
                                     in.alu_ib,
                                     in.alu_two_pow_s,
                                     in.main_clk,
                                     in.powers_power_of_2);
    }
};

template <typename FF_>
class lookup_pow_2_0_relation : public GenericLookupRelation<lookup_pow_2_0_lookup_settings, FF_> {
  public:
    static constexpr const char* NAME = "lookup_pow_2_0";
};
template <typename FF_> using lookup_pow_2_0 = GenericLookup<lookup_pow_2_0_lookup_settings, FF_>;

} // namespace bb