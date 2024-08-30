// AUTOGENERATED FILE
#pragma once

#include "barretenberg/relations/generic_permutation/generic_permutation_relation.hpp"

#include <cstddef>
#include <tuple>

namespace bb {

class perm_rng_alu_permutation_settings {
  public:
    // This constant defines how many columns are bundled together to form each set.
    constexpr static size_t COLUMNS_PER_SET = 3;

    template <typename AllEntities> static inline auto inverse_polynomial_is_computed_at_row(const AllEntities& in)
    {
        return (in.range_check_alu_rng_chk == 1 || in.alu_range_check_sel == 1);
    }

    template <typename AllEntities> static inline auto get_const_entities(const AllEntities& in)
    {
        return std::forward_as_tuple(in.perm_rng_alu_inv,
                                     in.range_check_alu_rng_chk,
                                     in.range_check_alu_rng_chk,
                                     in.alu_range_check_sel,
                                     in.range_check_clk,
                                     in.range_check_value,
                                     in.range_check_rng_chk_bits,
                                     in.alu_clk,
                                     in.alu_range_check_input_value,
                                     in.alu_range_check_num_bits);
    }

    template <typename AllEntities> static inline auto get_nonconst_entities(AllEntities& in)
    {
        return std::forward_as_tuple(in.perm_rng_alu_inv,
                                     in.range_check_alu_rng_chk,
                                     in.range_check_alu_rng_chk,
                                     in.alu_range_check_sel,
                                     in.range_check_clk,
                                     in.range_check_value,
                                     in.range_check_rng_chk_bits,
                                     in.alu_clk,
                                     in.alu_range_check_input_value,
                                     in.alu_range_check_num_bits);
    }
};

template <typename FF_>
class perm_rng_alu_relation : public GenericPermutationRelation<perm_rng_alu_permutation_settings, FF_> {
  public:
    static constexpr const char* NAME = "PERM_RNG_ALU";
};
template <typename FF_> using perm_rng_alu = GenericPermutation<perm_rng_alu_permutation_settings, FF_>;

} // namespace bb